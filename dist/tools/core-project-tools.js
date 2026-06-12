"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCoreTools = void 0;
const project_tools_1 = require("./project-tools");
const core_action_utils_1 = require("./core-action-utils");
class ProjectCoreTools {
    constructor() {
        this.project = new project_tools_1.ProjectTools();
        this.actions = {
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
    }
    getTools() {
        return [
            {
                name: 'manage',
                description: 'Project management (info/settings/run/build)',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'build_system',
                description: 'Build system operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.build_system), 'Parameters for the selected action')
            },
            {
                name: 'preview',
                description: 'Preview server operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.preview), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.ProjectCoreTools = ProjectCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1wcm9qZWN0LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvcmUtcHJvamVjdC10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxtREFBK0M7QUFDL0MsMkRBQXNGO0FBRXRGLE1BQWEsZ0JBQWdCO0lBQTdCO1FBQ1ksWUFBTyxHQUFHLElBQUksNEJBQVksRUFBRSxDQUFDO1FBRTdCLFlBQU8sR0FBa0I7WUFDN0IsTUFBTSxFQUFFO2dCQUNKLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtnQkFDNUQsUUFBUSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLHNCQUFzQixFQUFFO2dCQUNwRSxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2dCQUN0RCxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2FBQzdEO1lBQ0QsWUFBWSxFQUFFO2dCQUNWLFlBQVksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxvQkFBb0IsRUFBRTtnQkFDdEUsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFFO2dCQUNsRSxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsc0JBQXNCLEVBQUU7YUFDM0U7WUFDRCxPQUFPLEVBQUU7Z0JBQ0wsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLHNCQUFzQixFQUFFO2dCQUNqRSxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7YUFDbEU7U0FDSixDQUFDO0lBeUJOLENBQUM7SUF2QkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsOENBQThDO2dCQUMzRCxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDekc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsY0FBYztnQkFDcEIsV0FBVyxFQUFFLHlCQUF5QjtnQkFDdEMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQy9HO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQzFHO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsSUFBUztRQUNyQyxPQUFPLElBQUEsaUNBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0o7QUE1Q0QsNENBNENDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdjEuNSBjb3JlIHByb2plY3QgdG9vbHM6IGFjdGlvbi1iYXNlZCBmYWNhZGUuXG5pbXBvcnQgeyBUb29sRGVmaW5pdGlvbiwgVG9vbEV4ZWN1dG9yLCBUb29sUmVzcG9uc2UgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyBQcm9qZWN0VG9vbHMgfSBmcm9tICcuL3Byb2plY3QtdG9vbHMnO1xuaW1wb3J0IHsgYnVpbGRBY3Rpb25TY2hlbWEsIGV4ZWN1dGVBY3Rpb24sIFRvb2xBY3Rpb25NYXAgfSBmcm9tICcuL2NvcmUtYWN0aW9uLXV0aWxzJztcblxuZXhwb3J0IGNsYXNzIFByb2plY3RDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgcHJvamVjdCA9IG5ldyBQcm9qZWN0VG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgbWFuYWdlOiB7XG4gICAgICAgICAgICBpbmZvOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ2dldF9wcm9qZWN0X2luZm8nIH0sXG4gICAgICAgICAgICBzZXR0aW5nczogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdnZXRfcHJvamVjdF9zZXR0aW5ncycgfSxcbiAgICAgICAgICAgIHJ1bjogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdydW5fcHJvamVjdCcgfSxcbiAgICAgICAgICAgIGJ1aWxkOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ2J1aWxkX3Byb2plY3QnIH1cbiAgICAgICAgfSxcbiAgICAgICAgYnVpbGRfc3lzdGVtOiB7XG4gICAgICAgICAgICBnZXRfc2V0dGluZ3M6IHsgZXhlY3V0b3I6IHRoaXMucHJvamVjdCwgbWV0aG9kOiAnZ2V0X2J1aWxkX3NldHRpbmdzJyB9LFxuICAgICAgICAgICAgb3Blbl9wYW5lbDogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdvcGVuX2J1aWxkX3BhbmVsJyB9LFxuICAgICAgICAgICAgY2hlY2tfc3RhdHVzOiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ2NoZWNrX2J1aWxkZXJfc3RhdHVzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHByZXZpZXc6IHtcbiAgICAgICAgICAgIHN0YXJ0OiB7IGV4ZWN1dG9yOiB0aGlzLnByb2plY3QsIG1ldGhvZDogJ3N0YXJ0X3ByZXZpZXdfc2VydmVyJyB9LFxuICAgICAgICAgICAgc3RvcDogeyBleGVjdXRvcjogdGhpcy5wcm9qZWN0LCBtZXRob2Q6ICdzdG9wX3ByZXZpZXdfc2VydmVyJyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ21hbmFnZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcm9qZWN0IG1hbmFnZW1lbnQgKGluZm8vc2V0dGluZ3MvcnVuL2J1aWxkKScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5tYW5hZ2UpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdidWlsZF9zeXN0ZW0nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnVpbGQgc3lzdGVtIG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuYnVpbGRfc3lzdGVtKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncHJldmlldycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmV2aWV3IHNlcnZlciBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnByZXZpZXcpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=