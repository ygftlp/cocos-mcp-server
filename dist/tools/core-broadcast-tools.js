"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastCoreTools = void 0;
const broadcast_tools_1 = require("./broadcast-tools");
const core_action_utils_1 = require("./core-action-utils");
class BroadcastCoreTools {
    constructor() {
        this.broadcast = new broadcast_tools_1.BroadcastTools();
        this.actions = {
            message: {
                listen: { executor: this.broadcast, method: 'listen_broadcast' },
                stop: { executor: this.broadcast, method: 'stop_listening' },
                get_log: { executor: this.broadcast, method: 'get_broadcast_log' },
                clear_log: { executor: this.broadcast, method: 'clear_broadcast_log' },
                active_listeners: { executor: this.broadcast, method: 'get_active_listeners' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'message',
                description: 'Broadcast messaging',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.message), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.BroadcastCoreTools = BroadcastCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1icm9hZGNhc3QtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1icm9hZGNhc3QtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsdURBQW1EO0FBQ25ELDJEQUFzRjtBQUV0RixNQUFhLGtCQUFrQjtJQUEvQjtRQUNZLGNBQVMsR0FBRyxJQUFJLGdDQUFjLEVBQUUsQ0FBQztRQUVqQyxZQUFPLEdBQWtCO1lBQzdCLE9BQU8sRUFBRTtnQkFDTCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQ2hFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRTtnQkFDNUQsT0FBTyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUNsRSxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7Z0JBQ3RFLGdCQUFnQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHNCQUFzQixFQUFFO2FBQ2pGO1NBQ0osQ0FBQztJQWVOLENBQUM7SUFiRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSxxQkFBcUI7Z0JBQ2xDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUMxRztTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsT0FBTyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNKO0FBMUJELGdEQTBCQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHYxLjUgY29yZSBicm9hZGNhc3QgdG9vbHM6IGFjdGlvbi1iYXNlZCBmYWNhZGUuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbEV4ZWN1dG9yLCBUb29sUmVzcG9uc2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBCcm9hZGNhc3RUb29scyB9IGZyb20gJy4vYnJvYWRjYXN0LXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBCcm9hZGNhc3RDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgYnJvYWRjYXN0ID0gbmV3IEJyb2FkY2FzdFRvb2xzKCk7XG5cbiAgICBwcml2YXRlIGFjdGlvbnM6IFRvb2xBY3Rpb25NYXAgPSB7XG4gICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGxpc3RlbjogeyBleGVjdXRvcjogdGhpcy5icm9hZGNhc3QsIG1ldGhvZDogJ2xpc3Rlbl9icm9hZGNhc3QnIH0sXG4gICAgICAgICAgICBzdG9wOiB7IGV4ZWN1dG9yOiB0aGlzLmJyb2FkY2FzdCwgbWV0aG9kOiAnc3RvcF9saXN0ZW5pbmcnIH0sXG4gICAgICAgICAgICBnZXRfbG9nOiB7IGV4ZWN1dG9yOiB0aGlzLmJyb2FkY2FzdCwgbWV0aG9kOiAnZ2V0X2Jyb2FkY2FzdF9sb2cnIH0sXG4gICAgICAgICAgICBjbGVhcl9sb2c6IHsgZXhlY3V0b3I6IHRoaXMuYnJvYWRjYXN0LCBtZXRob2Q6ICdjbGVhcl9icm9hZGNhc3RfbG9nJyB9LFxuICAgICAgICAgICAgYWN0aXZlX2xpc3RlbmVyczogeyBleGVjdXRvcjogdGhpcy5icm9hZGNhc3QsIG1ldGhvZDogJ2dldF9hY3RpdmVfbGlzdGVuZXJzJyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21lc3NhZ2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvYWRjYXN0IG1lc3NhZ2luZycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5tZXNzYWdlKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVBY3Rpb24odG9vbE5hbWUsIGFyZ3MsIHRoaXMuYWN0aW9ucyk7XG4gICAgfVxufVxuIl19