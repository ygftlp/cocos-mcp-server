import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolExecutor, ToolResponse } from '../types';
import { ProjectTools } from './project-tools';

interface PlaytestStage {
    name: string;
    status: 'completed' | 'failed' | 'skipped';
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    details?: any;
    error?: string;
}

export class EnhancedProjectTools implements ToolExecutor {
    private readonly base: ProjectTools;

    constructor(private readonly adapter: CocosAdapter = selectCocosAdapter()) {
        this.base = new ProjectTools(adapter);
    }

    getTools() { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'quick_start_project': return this.quickStartProject(args || {});
            case 'build_project': return this.executeBuildProject(args || {});
            case 'build_and_run': return this.buildAndRun(args || {});
            default: return this.base.execute(toolName, args);
        }
    }

    private project() {
        return this.adapter.project.describe();
    }

    private async quickStartProject(args: any): Promise<ToolResponse> {
        const template = ['2d', '3d', 'minimal'].includes(args.template) ? args.template : '2d';
        const root = typeof args.root === 'string' && args.root.trim() ? args.root.trim() : 'assets/game';
        const overwrite = Boolean(args.overwrite);
        const dryRun = Boolean(args.dryRun);
        let targetRoot: string;
        try {
            targetRoot = this.resolveProjectAssetPath(root);
        } catch (error: any) {
            return { success: false, error: error.message };
        }

        const project = this.project();
        const files = this.createStarterFiles(template, project.name);
        const created: string[] = [];
        const updated: string[] = [];
        const skipped: string[] = [];
        for (const [relativePath, content] of Object.entries(files)) {
            const destination = path.join(targetRoot, relativePath);
            const projectRelative = path.relative(project.path, destination).replace(/\\/g, '/');
            const exists = fs.existsSync(destination);
            if (exists && !overwrite) {
                skipped.push(projectRelative);
                continue;
            }
            if (!dryRun) {
                fs.mkdirSync(path.dirname(destination), { recursive: true });
                fs.writeFileSync(destination, content, 'utf8');
            }
            (exists ? updated : created).push(projectRelative);
        }

        if (!dryRun) {
            const relativeToAssets = path.relative(path.join(project.path, 'assets'), targetRoot).replace(/\\/g, '/');
            const dbUrl = relativeToAssets && relativeToAssets !== '.' ? `db://assets/${relativeToAssets}` : 'db://assets';
            try {
                await this.adapter.asset.refreshAsset(dbUrl);
            } catch (error) {
                console.warn('[EnhancedProjectTools] Asset refresh failed:', error);
            }
        }

        return {
            success: true,
            data: {
                template,
                root: path.relative(project.path, targetRoot).replace(/\\/g, '/'),
                dryRun,
                created,
                updated,
                skipped,
                nextSteps: [
                    'Create or open a scene.',
                    'Add a root node and attach the generated SceneEntry component.',
                    'Use scene/node/component MCP tools to create gameplay objects.',
                    'Call project_playtest to build, launch, inspect, and capture the game from the Creator extension.'
                ]
            },
            message: dryRun
                ? `Quick-start preview generated for the ${template} template`
                : `Cocos ${template} starter structure created`
        };
    }

    private async executeBuildProject(args: any): Promise<ToolResponse> {
        const mode = ['editor', 'cli', 'auto'].includes(args.mode) ? args.mode : 'auto';
        const buildOptions = this.normalizeBuildOptions(args);
        if (args.dryRun) {
            return {
                success: true,
                data: { mode, buildOptions, command: this.buildCliPreview(args.creatorPath, buildOptions) },
                message: 'Build dry run completed'
            };
        }

        const errors: string[] = [];
        if (mode === 'editor' || mode === 'auto') {
            try {
                const ready = await this.adapter.build.queryWorkerReady();
                if (!ready) throw new Error('Cocos Builder worker is not ready');
                const result = await this.adapter.build.build(buildOptions);
                return {
                    success: true,
                    data: { mode: 'editor', options: buildOptions, result },
                    message: `Build completed for ${buildOptions.platform}`
                };
            } catch (error: any) {
                errors.push(`Editor build failed: ${error?.message || String(error)}`);
                if (mode === 'editor') return this.buildFailure(args, buildOptions, errors);
            }
        }

        if ((mode === 'cli' || mode === 'auto') && args.creatorPath) {
            try {
                const result = await this.runCliBuild(args.creatorPath, buildOptions, args.timeoutMs);
                return {
                    success: true,
                    data: { mode: 'cli', options: buildOptions, ...result },
                    message: `CLI build completed for ${buildOptions.platform}`
                };
            } catch (error: any) {
                errors.push(`CLI build failed: ${error?.message || String(error)}`);
            }
        } else if (mode === 'cli') {
            errors.push('creatorPath is required for CLI build mode');
        }
        return this.buildFailure(args, buildOptions, errors);
    }

    private async buildAndRun(args: any): Promise<ToolResponse> {
        const transactionId = randomUUID();
        const stages: PlaytestStage[] = [];
        const platform = String(args.platform || 'web-desktop');
        const rollbackOnFailure = args.rollbackOnFailure !== false;
        let buildResult: ToolResponse | null = null;
        let runtimeSession: any = null;
        let screenshot: any = null;
        let logResult: any = null;

        if (!platform.startsWith('web-')) {
            return {
                success: false,
                error: `Plugin playtest currently requires a web build platform; received '${platform}'`,
                data: { transactionId, platform, stages }
            };
        }

        const runStage = async <T>(name: string, operation: () => Promise<T>, details?: any): Promise<T> => {
            const started = Date.now();
            const startedAt = new Date(started).toISOString();
            try {
                const value = await operation();
                const finished = Date.now();
                stages.push({
                    name,
                    status: 'completed',
                    startedAt,
                    finishedAt: new Date(finished).toISOString(),
                    durationMs: finished - started,
                    ...(details !== undefined ? { details } : {})
                });
                return value;
            } catch (error: any) {
                const finished = Date.now();
                stages.push({
                    name,
                    status: 'failed',
                    startedAt,
                    finishedAt: new Date(finished).toISOString(),
                    durationMs: finished - started,
                    ...(details !== undefined ? { details } : {}),
                    error: error?.message || String(error)
                });
                throw error;
            }
        };

        try {
            if (args.stopExisting !== false) {
                await runStage('stop-existing-runtime', () => this.adapter.runtime.stop());
            } else {
                const now = new Date().toISOString();
                stages.push({ name: 'stop-existing-runtime', status: 'skipped', startedAt: now, finishedAt: now, durationMs: 0 });
            }

            buildResult = await runStage('creator-build', async () => {
                const response = await this.executeBuildProject({
                    ...args,
                    platform,
                    mode: args.mode || 'editor',
                    fallbackOpenPanel: args.fallbackOpenPanel !== false,
                    dryRun: false
                });
                if (!response.success) throw new Error(response.error || 'Cocos Creator build failed');
                return response;
            }, { platform, mode: args.mode || 'editor' });

            runtimeSession = await runStage('runtime-start', () => this.adapter.runtime.start({
                buildPath: args.runtimeBuildPath || args.buildPath,
                browserPath: args.browserPath,
                headless: args.headless !== false,
                width: args.width,
                height: args.height,
                host: args.host,
                port: args.port,
                startupTimeoutMs: args.startupTimeoutMs,
                extraBrowserArgs: args.extraBrowserArgs
            }));

            const readyExpression = String(args.readyExpression || `Boolean(globalThis.__COCOS_MCP_TEST__?.getState?.().ready || (document.readyState === 'complete' && document.querySelector('canvas')))`);
            const readyValue = await runStage('runtime-ready', () => this.adapter.runtime.waitFor(
                readyExpression,
                args.readyTimeoutMs || 30000,
                args.readyIntervalMs || 100
            ), { expression: readyExpression });

            if (args.captureScreenshot !== false) {
                screenshot = await runStage('runtime-screenshot', () => this.adapter.runtime.screenshot({
                    format: args.screenshotFormat || 'png',
                    quality: args.screenshotQuality,
                    filePath: args.screenshotPath || `playtest-${transactionId}.png`,
                    fullPage: Boolean(args.fullPage)
                }));
            } else {
                const now = new Date().toISOString();
                stages.push({ name: 'runtime-screenshot', status: 'skipped', startedAt: now, finishedAt: now, durationMs: 0 });
            }

            logResult = await runStage('runtime-logs', () => this.adapter.runtime.logs(0, false));
            const errorLogs = (logResult.entries || []).filter((entry: any) => entry.level === 'error');
            if (args.failOnRuntimeError !== false && errorLogs.length) {
                throw new Error(`Runtime produced ${errorLogs.length} error log(s): ${errorLogs.slice(0, 3).map((entry: any) => entry.text).join(' | ')}`);
            }

            const data: any = {
                transactionId,
                platform,
                build: buildResult.data,
                runtime: runtimeSession,
                readiness: { matched: true, value: readyValue },
                screenshot: screenshot ? {
                    mimeType: screenshot.mimeType,
                    filePath: screenshot.filePath,
                    bytes: Buffer.byteLength(screenshot.base64, 'base64')
                } : null,
                logs: {
                    count: logResult.entries?.length || 0,
                    errorCount: errorLogs.length,
                    entries: args.includeLogs === false ? undefined : logResult.entries,
                    nextSequence: logResult.nextSequence
                },
                stages
            };

            return {
                success: true,
                data,
                message: 'Cocos Creator plugin playtest completed',
                ...(screenshot ? {
                    _mcpContent: [
                        { type: 'text', text: JSON.stringify({ success: true, transactionId, runtime: runtimeSession, errorCount: errorLogs.length }) },
                        { type: 'image', data: screenshot.base64, mimeType: screenshot.mimeType }
                    ]
                } : {})
            } as ToolResponse;
        } catch (error: any) {
            if (rollbackOnFailure) {
                try {
                    await runStage('rollback-runtime-stop', () => this.adapter.runtime.stop());
                } catch {
                    // The failed rollback is already recorded in stages.
                }
            }
            return {
                success: false,
                error: error?.message || String(error),
                data: {
                    transactionId,
                    platform,
                    build: buildResult?.data || null,
                    runtime: runtimeSession,
                    screenshot: screenshot ? { mimeType: screenshot.mimeType, filePath: screenshot.filePath } : null,
                    logs: logResult,
                    rollbackOnFailure,
                    stages
                }
            };
        }
    }

    private async buildFailure(args: any, buildOptions: Record<string, any>, errors: string[]): Promise<ToolResponse> {
        let panelOpened = false;
        if (args.fallbackOpenPanel !== false) {
            try {
                await this.adapter.build.openPanel();
                panelOpened = true;
            } catch (error: any) {
                errors.push(`Could not open Build panel: ${error?.message || String(error)}`);
            }
        }
        return {
            success: false,
            error: errors.join('; ') || 'Build failed',
            data: {
                options: buildOptions,
                panelOpened,
                cliCommand: this.buildCliPreview(args.creatorPath, buildOptions)
            }
        };
    }

    private normalizeBuildOptions(args: any): Record<string, any> {
        const supplied = args.options && typeof args.options === 'object' ? args.options : {};
        const options: Record<string, any> = {
            ...supplied,
            platform: args.platform || supplied.platform || 'web-desktop'
        };
        for (const [key, value] of Object.entries({
            debug: args.debug,
            outputName: args.outputName,
            buildPath: args.buildPath,
            name: args.name,
            stage: args.stage
        })) {
            if (value !== undefined && value !== null && value !== '') options[key] = value;
        }
        return options;
    }

    private runCliBuild(creatorPath: string, buildOptions: Record<string, any>, requestedTimeout?: number): Promise<any> {
        const projectPath = this.project().path;
        return new Promise((resolve, reject) => {
            const timeoutMs = Number.isFinite(Number(requestedTimeout))
                ? Math.max(1000, Math.min(Number(requestedTimeout), 60 * 60 * 1000))
                : 20 * 60 * 1000;
            const child = spawn(
                creatorPath,
                ['--project', projectPath, '--build', this.serializeBuildOptions(buildOptions)],
                { cwd: projectPath, windowsHide: true, shell: false }
            );
            let stdout = '';
            let stderr = '';
            let settled = false;
            const finish = (callback: () => void) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                callback();
            };
            const timer = setTimeout(() => {
                child.kill();
                finish(() => reject(new Error(`Cocos Creator build timed out after ${timeoutMs}ms`)));
            }, timeoutMs);
            child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
            child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
            child.once('error', (error) => finish(() => reject(error)));
            child.once('close', (code) => finish(() => {
                if (code === 36 || code === 0) resolve({ exitCode: code, stdout, stderr });
                else reject(new Error(`Cocos Creator exited with code ${code}. ${stderr || stdout}`));
            }));
        });
    }

    private serializeBuildOptions(options: Record<string, any>): string {
        return Object.entries(options)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
            .join(';');
    }

    private buildCliPreview(creatorPath: string | undefined, options: Record<string, any>): string {
        return `"${creatorPath || '<CocosCreator executable>'}" --project "${this.project().path}" --build "${this.serializeBuildOptions(options)}"`;
    }

    private resolveProjectAssetPath(input: string): string {
        const normalized = input.replace(/\\/g, '/').replace(/^\.\//, '');
        if (path.isAbsolute(normalized) || normalized.includes('\0')) {
            throw new Error('root must be a project-relative path under assets/');
        }
        const withAssets = normalized === 'assets' || normalized.startsWith('assets/')
            ? normalized
            : `assets/${normalized}`;
        const projectPath = this.project().path;
        const assetsRoot = path.resolve(projectPath, 'assets');
        const target = path.resolve(projectPath, withAssets);
        if (target !== assetsRoot && !target.startsWith(`${assetsRoot}${path.sep}`)) {
            throw new Error('root must stay inside the project assets directory');
        }
        return target;
    }

    private createStarterFiles(template: string, projectName: string): Record<string, string> {
        const dimension = template === '3d' ? '3d' : '2d';
        const generatedAt = new Date().toISOString();
        return {
            'scripts/core/GameConfig.ts': `export const GameConfig = {\n    projectName: ${JSON.stringify(projectName)},\n    template: ${JSON.stringify(template)},\n    dimension: ${JSON.stringify(dimension)},\n    startScene: 'main'\n} as const;\n`,
            'scripts/core/EventBus.ts': `type Listener<T = unknown> = (payload: T) => void;\n\nexport class EventBus {\n    private static listeners = new Map<string, Set<Listener>>();\n    static on<T>(event: string, listener: Listener<T>): () => void {\n        const listeners = this.listeners.get(event) || new Set<Listener>();\n        listeners.add(listener as Listener);\n        this.listeners.set(event, listeners);\n        return () => this.off(event, listener);\n    }\n    static off<T>(event: string, listener: Listener<T>): void { this.listeners.get(event)?.delete(listener as Listener); }\n    static emit<T>(event: string, payload: T): void { this.listeners.get(event)?.forEach((listener) => listener(payload)); }\n    static clear(): void { this.listeners.clear(); }\n}\n`,
            'scripts/core/GameBootstrap.ts': `import { director, game, Node } from 'cc';\nimport { GameConfig } from './GameConfig';\n\nexport class GameBootstrap {\n    private static initialized = false;\n    static initialize(root: Node): void {\n        if (this.initialized) return;\n        this.initialized = true;\n        game.addPersistRootNode(root);\n        console.info('[GameBootstrap] initialized', GameConfig);\n    }\n    static loadScene(sceneName: string = GameConfig.startScene): Promise<void> {\n        return new Promise((resolve, reject) => director.loadScene(sceneName, (error) => error ? reject(error) : resolve()));\n    }\n}\n`,
            'scripts/components/SceneEntry.ts': `import { _decorator, Component } from 'cc';\nimport { GameBootstrap } from '../core/GameBootstrap';\nconst { ccclass } = _decorator;\n@ccclass('SceneEntry')\nexport class SceneEntry extends Component { protected onLoad(): void { GameBootstrap.initialize(this.node); } }\n`,
            'data/project-context.json': `${JSON.stringify({
                project: projectName,
                template,
                dimension,
                generatedBy: 'cocos-mcp-server',
                generatedAt
            }, null, 2)}\n`,
            'README.md': `# ${projectName} starter\n\nGenerated by cocos-mcp-server using the **${template}** template.\n\nAttach \`SceneEntry\` to the first scene root, then use MCP scene, UI, node, and component tools to assemble the game.\n`
        };
    }
}
