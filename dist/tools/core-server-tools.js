"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerCoreTools = void 0;
const core_action_utils_1 = require("./core-action-utils");
class ServerCoreTools {
    constructor(serverTools) {
        this.actions = {
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
        this.server = serverTools;
    }
    getTools() {
        return [
            {
                name: 'info',
                description: 'Server information and connectivity',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.info), 'Parameters for the selected action')
            },
            {
                name: 'batch',
                description: 'Batch calls and cache control',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.batch), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.ServerCoreTools = ServerCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1zZXJ2ZXItdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1zZXJ2ZXItdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsMkRBQXNGO0FBRXRGLE1BQWEsZUFBZTtJQUd4QixZQUFZLFdBQXdCO1FBSTVCLFlBQU8sR0FBa0I7WUFDN0IsSUFBSSxFQUFFO2dCQUNGLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBRTtnQkFDbEUsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLDZCQUE2QixFQUFFO2dCQUNoRixJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQzVELE1BQU0sRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxtQkFBbUIsRUFBRTtnQkFDOUQsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLDJCQUEyQixFQUFFO2dCQUM1RSxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSx3QkFBd0IsRUFBRTthQUNsRjtZQUNELEtBQUssRUFBRTtnQkFDSCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFO2dCQUNyRCxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTthQUMxRTtTQUNKLENBQUM7UUFoQkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDOUIsQ0FBQztJQWlCRCxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxNQUFNO2dCQUNaLFdBQVcsRUFBRSxxQ0FBcUM7Z0JBQ2xELFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN2RztZQUNEO2dCQUNJLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSwrQkFBK0I7Z0JBQzVDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN4RztTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsT0FBTyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNKO0FBeENELDBDQXdDQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHYxLjUgY29yZSBzZXJ2ZXIgdG9vbHM6IGFjdGlvbi1iYXNlZCBmYWNhZGUuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbEV4ZWN1dG9yLCBUb29sUmVzcG9uc2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBTZXJ2ZXJUb29scyB9IGZyb20gJy4vc2VydmVyLXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBTZXJ2ZXJDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgc2VydmVyOiBTZXJ2ZXJUb29scztcblxuICAgIGNvbnN0cnVjdG9yKHNlcnZlclRvb2xzOiBTZXJ2ZXJUb29scykge1xuICAgICAgICB0aGlzLnNlcnZlciA9IHNlcnZlclRvb2xzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgaW5mbzoge1xuICAgICAgICAgICAgaXBfbGlzdDogeyBleGVjdXRvcjogdGhpcy5zZXJ2ZXIsIG1ldGhvZDogJ3F1ZXJ5X3NlcnZlcl9pcF9saXN0JyB9LFxuICAgICAgICAgICAgaXBfbGlzdF9zb3J0ZWQ6IHsgZXhlY3V0b3I6IHRoaXMuc2VydmVyLCBtZXRob2Q6ICdxdWVyeV9zb3J0ZWRfc2VydmVyX2lwX2xpc3QnIH0sXG4gICAgICAgICAgICBwb3J0OiB7IGV4ZWN1dG9yOiB0aGlzLnNlcnZlciwgbWV0aG9kOiAncXVlcnlfc2VydmVyX3BvcnQnIH0sXG4gICAgICAgICAgICBzdGF0dXM6IHsgZXhlY3V0b3I6IHRoaXMuc2VydmVyLCBtZXRob2Q6ICdnZXRfc2VydmVyX3N0YXR1cycgfSxcbiAgICAgICAgICAgIGNvbm5lY3Rpdml0eTogeyBleGVjdXRvcjogdGhpcy5zZXJ2ZXIsIG1ldGhvZDogJ2NoZWNrX3NlcnZlcl9jb25uZWN0aXZpdHknIH0sXG4gICAgICAgICAgICBuZXR3b3JrX2ludGVyZmFjZXM6IHsgZXhlY3V0b3I6IHRoaXMuc2VydmVyLCBtZXRob2Q6ICdnZXRfbmV0d29ya19pbnRlcmZhY2VzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGJhdGNoOiB7XG4gICAgICAgICAgICBjYWxsOiB7IGV4ZWN1dG9yOiB0aGlzLnNlcnZlciwgbWV0aG9kOiAnYmF0Y2hfY2FsbCcgfSxcbiAgICAgICAgICAgIGludmFsaWRhdGVfY2FjaGU6IHsgZXhlY3V0b3I6IHRoaXMuc2VydmVyLCBtZXRob2Q6ICdpbnZhbGlkYXRlX2NhY2hlJyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2luZm8nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2VydmVyIGluZm9ybWF0aW9uIGFuZCBjb25uZWN0aXZpdHknLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuaW5mbyksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2JhdGNoJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0JhdGNoIGNhbGxzIGFuZCBjYWNoZSBjb250cm9sJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmJhdGNoKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVBY3Rpb24odG9vbE5hbWUsIGFyZ3MsIHRoaXMuYWN0aW9ucyk7XG4gICAgfVxufVxuIl19