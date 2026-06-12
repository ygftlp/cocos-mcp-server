// v1.5 core broadcast tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { BroadcastTools } from './broadcast-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class BroadcastCoreTools implements ToolExecutor {
    private broadcast = new BroadcastTools();

    private actions: ToolActionMap = {
        message: {
            listen: { executor: this.broadcast, method: 'listen_broadcast' },
            stop: { executor: this.broadcast, method: 'stop_listening' },
            get_log: { executor: this.broadcast, method: 'get_broadcast_log' },
            clear_log: { executor: this.broadcast, method: 'clear_broadcast_log' },
            active_listeners: { executor: this.broadcast, method: 'get_active_listeners' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'message',
                description: 'Broadcast messaging',
                inputSchema: buildActionSchema(Object.keys(this.actions.message), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
