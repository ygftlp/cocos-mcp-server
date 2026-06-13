import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { EnhancedProjectTools } from './enhanced-project-tools';
import { GameProjectTools } from './game-project-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ProjectCoreTools implements ToolExecutor {
    private readonly project: EnhancedProjectTools;
    private readonly gameProject: GameProjectTools;
    private readonly actions: ToolActionMap;

    constructor(adapter: CocosAdapter = selectCocosAdapter()) {
        this.project = new EnhancedProjectTools(adapter);
        this.gameProject = new GameProjectTools(adapter);
        this.actions = {
            manage: {
                info: { executor: this.project, method: 'get_project_info' },
                settings: { executor: this.project, method: 'get_project_settings' }
            },
            build_system: {
                get_settings: { executor: this.project, method: 'get_build_settings' },
                open_panel: { executor: this.project, method: 'open_build_panel' },
                check_status: { executor: this.project, method: 'check_builder_status' }
            }
        };
    }

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Project information and settings',
                inputSchema: buildActionSchema(this.actions.manage, 'Project management parameters')
            },
            {
                name: 'quick_start',
                title: 'Quick start Cocos project',
                description: 'Create a maintainable Cocos 2D, 3D, or minimal starter structure inside the current project.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        template: { type: 'string', enum: ['2d', '3d', 'minimal'], default: '2d' },
                        root: { type: 'string', description: 'Project-relative target directory under assets/', default: 'assets/game' },
                        overwrite: { type: 'boolean', default: false },
                        dryRun: { type: 'boolean', default: false }
                    },
                    additionalProperties: false
                },
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'medium', scope: ['project', 'assets'],
                    requires: ['project.write', 'asset.write']
                }
            },
            {
                name: 'create_game',
                title: 'Create complete playable Cocos game',
                description: 'Create scripts, a playable scene, node/component hierarchy, verification report, and build handoff. Use the built-in asset-free arcade template or a custom declarative blueprint.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        template: { type: 'string', enum: ['arcade-clicker-2d', 'custom'], default: 'arcade-clicker-2d' },
                        projectName: { type: 'string' },
                        root: { type: 'string', default: 'assets/game' },
                        sceneName: { type: 'string', default: 'Main' },
                        sceneFolder: { type: 'string', description: 'db://assets folder or path relative to root', default: 'scenes' },
                        overwrite: { type: 'boolean', default: false },
                        dryRun: { type: 'boolean', default: false },
                        scriptWaitMs: { type: 'integer', minimum: 1000, maximum: 120000, default: 30000 },
                        blueprint: {
                            type: 'object',
                            description: 'Required for template=custom',
                            properties: {
                                entryComponent: { type: 'string' },
                                files: {
                                    type: 'array', maxItems: 100,
                                    items: {
                                        type: 'object',
                                        properties: { path: { type: 'string' }, content: { type: 'string' } },
                                        required: ['path', 'content'], additionalProperties: false
                                    }
                                },
                                nodes: {
                                    type: 'array', minItems: 1, maxItems: 500,
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' }, name: { type: 'string' }, parentId: { type: 'string' },
                                            position: { type: 'object' }, rotation: { type: 'object' }, scale: { type: 'object' },
                                            components: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: { type: { type: 'string' }, properties: { type: 'object' } },
                                                    required: ['type'], additionalProperties: false
                                                }
                                            }
                                        },
                                        required: ['id', 'name'], additionalProperties: false
                                    }
                                }
                            },
                            required: ['nodes'], additionalProperties: false
                        }
                    },
                    additionalProperties: false
                },
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'high', scope: ['project', 'assets', 'scene'],
                    requires: ['project.write', 'asset.write', 'scene.write', 'node.write', 'component.write', 'ui.write']
                }
            },
            {
                name: 'build',
                title: 'Build Cocos project',
                description: 'Build the current Cocos project through the Creator extension Builder or the official Cocos Creator CLI.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        platform: { type: 'string', default: 'web-desktop' },
                        mode: { type: 'string', enum: ['auto', 'editor', 'cli'], default: 'auto' },
                        creatorPath: { type: 'string', description: 'Cocos Creator executable path, required for CLI mode' },
                        debug: { type: 'boolean' },
                        outputName: { type: 'string' },
                        buildPath: { type: 'string' },
                        stage: { type: 'string', enum: ['build', 'make'] },
                        options: { type: 'object', additionalProperties: true },
                        fallbackOpenPanel: { type: 'boolean', default: true },
                        dryRun: { type: 'boolean', default: false }
                    },
                    additionalProperties: false
                },
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'high', scope: ['project'],
                    requires: ['project.build']
                }
            },
            {
                name: 'playtest',
                title: 'Build and playtest inside the Cocos Creator extension',
                description: 'Run one plugin-native transaction that stops an existing session, builds through Creator Builder, launches the web build, waits for readiness, captures an MCP image, and checks runtime logs.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        platform: { type: 'string', enum: ['web-desktop', 'web-mobile'], default: 'web-desktop' },
                        mode: { type: 'string', enum: ['editor', 'auto', 'cli'], default: 'editor' },
                        creatorPath: { type: 'string' },
                        debug: { type: 'boolean' },
                        outputName: { type: 'string' },
                        buildPath: { type: 'string', description: 'Creator build output root' },
                        runtimeBuildPath: { type: 'string', description: 'Optional explicit directory containing the generated index.html' },
                        options: { type: 'object', additionalProperties: true },
                        headless: { type: 'boolean', default: true },
                        browserPath: { type: 'string' },
                        width: { type: 'integer', minimum: 320, maximum: 7680, default: 1280 },
                        height: { type: 'integer', minimum: 240, maximum: 4320, default: 720 },
                        host: { type: 'string', enum: ['127.0.0.1', 'localhost', '::1'], default: '127.0.0.1' },
                        port: { type: 'integer', minimum: 1, maximum: 65535 },
                        startupTimeoutMs: { type: 'integer', minimum: 3000, maximum: 120000, default: 30000 },
                        readyExpression: { type: 'string', description: 'JavaScript condition evaluated in the running game' },
                        readyTimeoutMs: { type: 'integer', minimum: 100, maximum: 300000, default: 30000 },
                        readyIntervalMs: { type: 'integer', minimum: 20, maximum: 5000, default: 100 },
                        stopExisting: { type: 'boolean', default: true },
                        rollbackOnFailure: { type: 'boolean', default: true },
                        failOnRuntimeError: { type: 'boolean', default: true },
                        captureScreenshot: { type: 'boolean', default: true },
                        screenshotPath: { type: 'string' },
                        screenshotFormat: { type: 'string', enum: ['png', 'jpeg', 'webp'], default: 'png' },
                        screenshotQuality: { type: 'integer', minimum: 1, maximum: 100 },
                        fullPage: { type: 'boolean', default: false },
                        includeLogs: { type: 'boolean', default: true },
                        fallbackOpenPanel: { type: 'boolean', default: true },
                        extraBrowserArgs: { type: 'array', items: { type: 'string' }, maxItems: 50 }
                    },
                    additionalProperties: false
                },
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'high', scope: ['project', 'runtime'],
                    requires: ['project.build', 'runtime.write', 'runtime.read']
                }
            },
            {
                name: 'build_system',
                description: 'Build system inspection and panel access',
                inputSchema: buildActionSchema(this.actions.build_system, 'Build system parameters')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        if (toolName === 'quick_start') return this.project.execute('quick_start_project', args);
        if (toolName === 'create_game') return this.gameProject.execute('create_game', args);
        if (toolName === 'build') return this.project.execute('build_project', args);
        if (toolName === 'playtest') return this.project.execute('build_and_run', args);
        return executeAction(toolName, args, this.actions);
    }

    clearCache(): void {
        const candidate = this.project as any;
        if (typeof candidate.clearCache === 'function') candidate.clearCache();
    }
}
