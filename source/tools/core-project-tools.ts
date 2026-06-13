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
                description: 'Build the current Cocos project through the editor Builder or the official Cocos Creator CLI.',
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
        return executeAction(toolName, args, this.actions);
    }

    clearCache(): void {
        const candidate = this.project as any;
        if (typeof candidate.clearCache === 'function') candidate.clearCache();
    }
}
