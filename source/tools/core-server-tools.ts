import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ServerTools } from './server-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ServerCoreTools implements ToolExecutor {
    constructor(private readonly server: ServerTools) {}

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
            { name: 'info', description: 'Server information and connectivity', inputSchema: buildActionSchema(this.actions.info, 'Server information parameters') },
            { name: 'batch', description: 'Bounded batch calls and cache invalidation', inputSchema: buildActionSchema(this.actions.batch, 'Batch operation parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
