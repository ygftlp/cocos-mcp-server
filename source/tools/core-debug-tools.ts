// v1.5 core debug tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { DebugTools } from './debug-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class DebugCoreTools implements ToolExecutor {
    private debug = new DebugTools();

    private actions: ToolActionMap = {
        console: {
            get: { executor: this.debug, method: 'get_console_logs' },
            clear: { executor: this.debug, method: 'clear_console' }
        },
        logs: {
            get_project_logs: { executor: this.debug, method: 'get_project_logs' },
            get_log_info: { executor: this.debug, method: 'get_log_file_info' },
            search: { executor: this.debug, method: 'search_project_logs' }
        },
        system: {
            editor_info: { executor: this.debug, method: 'get_editor_info' },
            performance: { executor: this.debug, method: 'get_performance_stats' },
            node_tree: { executor: this.debug, method: 'get_node_tree' },
            execute_script: { executor: this.debug, method: 'execute_script' }
        },
        validation: {
            validate_scene: { executor: this.debug, method: 'validate_scene' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'console',
                description: 'Console log access',
                inputSchema: buildActionSchema(Object.keys(this.actions.console), 'Parameters for the selected action')
            },
            {
                name: 'logs',
                description: 'Project log access and search',
                inputSchema: buildActionSchema(Object.keys(this.actions.logs), 'Parameters for the selected action')
            },
            {
                name: 'system',
                description: 'Editor/system diagnostics',
                inputSchema: buildActionSchema(Object.keys(this.actions.system), 'Parameters for the selected action')
            },
            {
                name: 'validation',
                description: 'Debug validations',
                inputSchema: buildActionSchema(Object.keys(this.actions.validation), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
