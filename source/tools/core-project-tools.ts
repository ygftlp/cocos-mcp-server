import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { EnhancedProjectTools } from './enhanced-project-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ProjectCoreTools implements ToolExecutor {
    private project = new EnhancedProjectTools();

    private actions: ToolActionMap = {
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
                xCocos: { kind: 'write', destructive: false, sideEffect: true, cost: 'medium', scope: ['project', 'assets'] }
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
                xCocos: { kind: 'write', destructive: false, sideEffect: true, cost: 'high', scope: ['project'] }
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
        if (toolName === 'build') return this.project.execute('build_project', args);
        return executeAction(toolName, args, this.actions);
    }

    clearCache(): void {
        const candidate = this.project as any;
        if (typeof candidate.clearCache === 'function') candidate.clearCache();
    }
}
