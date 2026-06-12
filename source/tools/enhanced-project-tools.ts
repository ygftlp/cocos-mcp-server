import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ToolResponse } from '../types';
import { ProjectTools } from './project-tools';

export class EnhancedProjectTools extends ProjectTools {
    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'quick_start_project':
                return this.quickStartProject(args || {});
            case 'build_project':
                return this.buildProject(args || {});
            default:
                return super.execute(toolName, args);
        }
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

        const files = this.createStarterFiles(template);
        const created: string[] = [];
        const updated: string[] = [];
        const skipped: string[] = [];

        for (const [relativePath, content] of Object.entries(files)) {
            const destination = path.join(targetRoot, relativePath);
            const projectRelative = path.relative(Editor.Project.path, destination).replace(/\\/g, '/');
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
            const relativeToAssets = path.relative(path.join(Editor.Project.path, 'assets'), targetRoot).replace(/\\/g, '/');
            const dbUrl = relativeToAssets && relativeToAssets !== '.'
                ? `db://assets/${relativeToAssets}`
                : 'db://assets';
            try {
                await Editor.Message.request('asset-db', 'refresh-asset', dbUrl);
            } catch (error) {
                console.warn('[EnhancedProjectTools] Asset refresh failed:', error);
            }
        }

        return {
            success: true,
            data: {
                template,
                root: path.relative(Editor.Project.path, targetRoot).replace(/\\/g, '/'),
                dryRun,
                created,
                updated,
                skipped,
                nextSteps: [
                    'Create or open a scene.',
                    'Add a root node and attach the generated SceneEntry component.',
                    'Use scene/node/component MCP tools to create gameplay objects.',
                    'Call project_build when ready to produce a platform build.'
                ]
            },
            message: dryRun
                ? `Quick-start preview generated for the ${template} template`
                : `Cocos ${template} starter structure created`
        };
    }

    private async buildProject(args: any): Promise<ToolResponse> {
        const mode = ['editor', 'cli', 'auto'].includes(args.mode) ? args.mode : 'auto';
        const buildOptions = this.normalizeBuildOptions(args);
        const dryRun = Boolean(args.dryRun);

        if (dryRun) {
            return {
                success: true,
                data: { mode, buildOptions, command: this.buildCliPreview(args.creatorPath, buildOptions) },
                message: 'Build dry run completed'
            };
        }

        const errors: string[] = [];
        if (mode === 'editor' || mode === 'auto') {
            try {
                const ready = await Editor.Message.request('builder', 'query-worker-ready');
                if (ready === false) throw new Error('Cocos Builder worker is not ready');
                const result = await Editor.Message.request('builder', 'build', buildOptions);
                return {
                    success: true,
                    data: { mode: 'editor', options: buildOptions, result },
                    message: `Build started for ${buildOptions.platform}`
                };
            } catch (error: any) {
                errors.push(`Editor build failed: ${error?.message || String(error)}`);
                if (mode === 'editor') return this.buildFailure(args, buildOptions, errors);
            }
        }

        if ((mode === 'cli' || mode === 'auto') && args.creatorPath) {
            try {
                const result = await this.runCliBuild(args.creatorPath, buildOptions);
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

    private async buildFailure(args: any, buildOptions: Record<string, any>, errors: string[]): Promise<ToolResponse> {
        const fallbackOpenPanel = args.fallbackOpenPanel !== false;
        let panelOpened = false;
        if (fallbackOpenPanel) {
            try {
                await Editor.Message.request('builder', 'open');
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

        const assignIfDefined = (key: string, value: any) => {
            if (value !== undefined && value !== null && value !== '') options[key] = value;
        };
        assignIfDefined('debug', args.debug);
        assignIfDefined('outputName', args.outputName);
        assignIfDefined('buildPath', args.buildPath);
        assignIfDefined('name', args.name);
        assignIfDefined('stage', args.stage);
        return options;
    }

    private runCliBuild(creatorPath: string, buildOptions: Record<string, any>): Promise<any> {
        return new Promise((resolve, reject) => {
            const buildArg = this.serializeBuildOptions(buildOptions);
            const child = spawn(creatorPath, [
                '--project', Editor.Project.path,
                '--build', buildArg
            ], {
                cwd: Editor.Project.path,
                windowsHide: true,
                shell: false
            });

            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
            child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
            child.once('error', reject);
            child.once('close', (code) => {
                if (code === 36 || code === 0) {
                    resolve({ exitCode: code, stdout, stderr });
                } else {
                    reject(new Error(`Cocos Creator exited with code ${code}. ${stderr || stdout}`));
                }
            });
        });
    }

    private serializeBuildOptions(options: Record<string, any>): string {
        return Object.entries(options)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
            .join(';');
    }

    private buildCliPreview(creatorPath: string | undefined, options: Record<string, any>): string {
        const executable = creatorPath || '<CocosCreator executable>';
        return `"${executable}" --project "${Editor.Project.path}" --build "${this.serializeBuildOptions(options)}"`;
    }

    private resolveProjectAssetPath(input: string): string {
        const normalized = input.replace(/\\/g, '/').replace(/^\.\//, '');
        if (path.isAbsolute(normalized) || normalized.includes('\0')) {
            throw new Error('root must be a project-relative path under assets/');
        }

        const withAssets = normalized === 'assets' || normalized.startsWith('assets/')
            ? normalized
            : `assets/${normalized}`;
        const assetsRoot = path.resolve(Editor.Project.path, 'assets');
        const target = path.resolve(Editor.Project.path, withAssets);
        if (target !== assetsRoot && !target.startsWith(`${assetsRoot}${path.sep}`)) {
            throw new Error('root must stay inside the project assets directory');
        }
        return target;
    }

    private createStarterFiles(template: string): Record<string, string> {
        const dimension = template === '3d' ? '3d' : '2d';
        const generatedAt = new Date().toISOString();
        return {
            'scripts/core/GameConfig.ts': `export const GameConfig = {\n    projectName: ${JSON.stringify(Editor.Project.name)},\n    template: ${JSON.stringify(template)},\n    dimension: ${JSON.stringify(dimension)},\n    startScene: 'main'\n} as const;\n`,
            'scripts/core/EventBus.ts': `type Listener<T = unknown> = (payload: T) => void;\n\nexport class EventBus {\n    private static listeners = new Map<string, Set<Listener>>();\n\n    static on<T>(event: string, listener: Listener<T>): () => void {\n        const listeners = this.listeners.get(event) || new Set<Listener>();\n        listeners.add(listener as Listener);\n        this.listeners.set(event, listeners);\n        return () => this.off(event, listener);\n    }\n\n    static off<T>(event: string, listener: Listener<T>): void {\n        this.listeners.get(event)?.delete(listener as Listener);\n    }\n\n    static emit<T>(event: string, payload: T): void {\n        this.listeners.get(event)?.forEach((listener) => listener(payload));\n    }\n\n    static clear(): void {\n        this.listeners.clear();\n    }\n}\n`,
            'scripts/core/GameBootstrap.ts': `import { director, game, Node } from 'cc';\nimport { GameConfig } from './GameConfig';\n\nexport class GameBootstrap {\n    private static initialized = false;\n\n    static initialize(root: Node): void {\n        if (this.initialized) return;\n        this.initialized = true;\n        game.addPersistRootNode(root);\n        console.info('[GameBootstrap] initialized', GameConfig);\n    }\n\n    static loadScene(sceneName: string = GameConfig.startScene): Promise<void> {\n        return new Promise((resolve, reject) => {\n            director.loadScene(sceneName, (error) => error ? reject(error) : resolve());\n        });\n    }\n}\n`,
            'scripts/components/SceneEntry.ts': `import { _decorator, Component } from 'cc';\nimport { GameBootstrap } from '../core/GameBootstrap';\n\nconst { ccclass } = _decorator;\n\n@ccclass('SceneEntry')\nexport class SceneEntry extends Component {\n    protected onLoad(): void {\n        GameBootstrap.initialize(this.node);\n    }\n}\n`,
            'data/project-context.json': `${JSON.stringify({
                project: Editor.Project.name,
                template,
                dimension,
                generatedBy: 'cocos-mcp-server',
                generatedAt
            }, null, 2)}\n`,
            'README.md': `# ${Editor.Project.name} starter\n\nGenerated by cocos-mcp-server using the **${template}** template.\n\n## Structure\n\n- \`scripts/core\`: project bootstrap, configuration, and event bus\n- \`scripts/components\`: Cocos components attachable from the editor\n- \`data/project-context.json\`: concise context for AI agents\n\nAttach \`SceneEntry\` to the root node of the first scene, then use MCP scene and node tools to assemble the game.\n`
        };
    }
}
