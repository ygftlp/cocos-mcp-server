// v1.5 core server tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ServerTools } from './server-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ServerCoreTools implements ToolExecutor {
    private server: ServerTools;

    constructor(serverTools: ServerTools) {
        this.server = serverTools;
    }

    private actions: ToolActionMap = {
        info: {
            ip_list: { executor: this.server, method: 'query_server_ip_list' },
            ip_list_sorted: { executor: this.server, method: 'query_sorted_server_ip_list' },
            port: { executor: this.server, method: 'query_server_port' },
            status: { executor: this.server, method: 'get_server_status' },
            connectivity: { executor: this.server, method: 'check_server_connectivity' },
            network_interfaces: { executor: this.server, method: 'get_network_interfaces' }
        },
        batch: {
            call: { executor: this.server, method: 'batch_call' },
            invalidate_cache: { executor: this.server, method: 'invalidate_cache' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'info',
                description: 'Server information and connectivity',
                inputSchema: buildActionSchema(Object.keys(this.actions.info), 'Parameters for the selected action')
            },
            {
                name: 'batch',
                description: 'Batch calls and cache control',
                inputSchema: buildActionSchema(Object.keys(this.actions.batch), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
