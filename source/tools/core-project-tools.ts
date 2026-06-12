// v1.5 core project tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ProjectTools } from './project-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ProjectCoreTools implements ToolExecutor {
    private project = new ProjectTools();

    private actions: ToolActionMap = {
        manage: {
            info: { executor: this.project, method: 'get_project_info' },
            settings: { executor: this.project, method: 'get_project_settings' },
            run: { executor: this.project, method: 'run_project' },
            build: { executor: this.project, method: 'build_project' }
        },
        build_system: {
            get_settings: { executor: this.project, method: 'get_build_settings' },
            open_panel: { executor: this.project, method: 'open_build_panel' },
            check_status: { executor: this.project, method: 'check_builder_status' }
        },
        preview: {
            start: { executor: this.project, method: 'start_preview_server' },
            stop: { executor: this.project, method: 'stop_preview_server' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Project management (info/settings/run/build)',
                inputSchema: buildActionSchema(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'build_system',
                description: 'Build system operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.build_system), 'Parameters for the selected action')
            },
            {
                name: 'preview',
                description: 'Preview server operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.preview), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
