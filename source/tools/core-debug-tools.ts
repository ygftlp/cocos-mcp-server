import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { DebugTools } from './debug-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class DebugCoreTools implements ToolExecutor {
    private debug = new DebugTools();

    private actions: ToolActionMap = {
        logs: {
            get_project_logs: { executor: this.debug, method: 'get_project_logs' },
            get_log_info: { executor: this.debug, method: 'get_log_file_info' },
            search: { executor: this.debug, method: 'search_project_logs' }
        },
        system: {
            editor_info: { executor: this.debug, method: 'get_editor_info' },
            performance: { executor: this.debug, method: 'get_performance_stats' },
            node_tree: { executor: this.debug, method: 'get_node_tree' }
        },
        validation: {
            validate_scene: { executor: this.debug, method: 'validate_scene' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            { name: 'logs', description: 'Project log access and search', inputSchema: buildActionSchema(this.actions.logs, 'Log query parameters') },
            { name: 'system', description: 'Editor and system diagnostics', inputSchema: buildActionSchema(this.actions.system, 'System diagnostic parameters') },
            { name: 'validation', description: 'Debug validations', inputSchema: buildActionSchema(this.actions.validation, 'Validation parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
