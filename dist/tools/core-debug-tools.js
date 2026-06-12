"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugCoreTools = void 0;
const debug_tools_1 = require("./debug-tools");
const core_action_utils_1 = require("./core-action-utils");
class DebugCoreTools {
    constructor() {
        this.debug = new debug_tools_1.DebugTools();
        this.actions = {
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
    }
    getTools() {
        return [
            {
                name: 'console',
                description: 'Console log access',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.console), 'Parameters for the selected action')
            },
            {
                name: 'logs',
                description: 'Project log access and search',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.logs), 'Parameters for the selected action')
            },
            {
                name: 'system',
                description: 'Editor/system diagnostics',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.system), 'Parameters for the selected action')
            },
            {
                name: 'validation',
                description: 'Debug validations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.validation), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.DebugCoreTools = DebugCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1kZWJ1Zy10b29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS90b29scy9jb3JlLWRlYnVnLXRvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLCtDQUEyQztBQUMzQywyREFBc0Y7QUFFdEYsTUFBYSxjQUFjO0lBQTNCO1FBQ1ksVUFBSyxHQUFHLElBQUksd0JBQVUsRUFBRSxDQUFDO1FBRXpCLFlBQU8sR0FBa0I7WUFDN0IsT0FBTyxFQUFFO2dCQUNMLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtnQkFDekQsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRTthQUMzRDtZQUNELElBQUksRUFBRTtnQkFDRixnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtnQkFDdEUsWUFBWSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUNuRSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7YUFDbEU7WUFDRCxNQUFNLEVBQUU7Z0JBQ0osV0FBVyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFO2dCQUNoRSxXQUFXLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsdUJBQXVCLEVBQUU7Z0JBQ3RFLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUU7Z0JBQzVELGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRTthQUNyRTtZQUNELFVBQVUsRUFBRTtnQkFDUixjQUFjLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7YUFDckU7U0FDSixDQUFDO0lBOEJOLENBQUM7SUE1QkcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsU0FBUztnQkFDZixXQUFXLEVBQUUsb0JBQW9CO2dCQUNqQyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDMUc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsTUFBTTtnQkFDWixXQUFXLEVBQUUsK0JBQStCO2dCQUM1QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDdkc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsUUFBUTtnQkFDZCxXQUFXLEVBQUUsMkJBQTJCO2dCQUN4QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDekc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsWUFBWTtnQkFDbEIsV0FBVyxFQUFFLG1CQUFtQjtnQkFDaEMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQzdHO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQWdCLEVBQUUsSUFBUztRQUNyQyxPQUFPLElBQUEsaUNBQWEsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN2RCxDQUFDO0NBQ0o7QUFwREQsd0NBb0RDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gdjEuNSBjb3JlIGRlYnVnIHRvb2xzOiBhY3Rpb24tYmFzZWQgZmFjYWRlLlxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xFeGVjdXRvciwgVG9vbFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgRGVidWdUb29scyB9IGZyb20gJy4vZGVidWctdG9vbHMnO1xuaW1wb3J0IHsgYnVpbGRBY3Rpb25TY2hlbWEsIGV4ZWN1dGVBY3Rpb24sIFRvb2xBY3Rpb25NYXAgfSBmcm9tICcuL2NvcmUtYWN0aW9uLXV0aWxzJztcblxuZXhwb3J0IGNsYXNzIERlYnVnQ29yZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIGRlYnVnID0gbmV3IERlYnVnVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgY29uc29sZToge1xuICAgICAgICAgICAgZ2V0OiB7IGV4ZWN1dG9yOiB0aGlzLmRlYnVnLCBtZXRob2Q6ICdnZXRfY29uc29sZV9sb2dzJyB9LFxuICAgICAgICAgICAgY2xlYXI6IHsgZXhlY3V0b3I6IHRoaXMuZGVidWcsIG1ldGhvZDogJ2NsZWFyX2NvbnNvbGUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgbG9nczoge1xuICAgICAgICAgICAgZ2V0X3Byb2plY3RfbG9nczogeyBleGVjdXRvcjogdGhpcy5kZWJ1ZywgbWV0aG9kOiAnZ2V0X3Byb2plY3RfbG9ncycgfSxcbiAgICAgICAgICAgIGdldF9sb2dfaW5mbzogeyBleGVjdXRvcjogdGhpcy5kZWJ1ZywgbWV0aG9kOiAnZ2V0X2xvZ19maWxlX2luZm8nIH0sXG4gICAgICAgICAgICBzZWFyY2g6IHsgZXhlY3V0b3I6IHRoaXMuZGVidWcsIG1ldGhvZDogJ3NlYXJjaF9wcm9qZWN0X2xvZ3MnIH1cbiAgICAgICAgfSxcbiAgICAgICAgc3lzdGVtOiB7XG4gICAgICAgICAgICBlZGl0b3JfaW5mbzogeyBleGVjdXRvcjogdGhpcy5kZWJ1ZywgbWV0aG9kOiAnZ2V0X2VkaXRvcl9pbmZvJyB9LFxuICAgICAgICAgICAgcGVyZm9ybWFuY2U6IHsgZXhlY3V0b3I6IHRoaXMuZGVidWcsIG1ldGhvZDogJ2dldF9wZXJmb3JtYW5jZV9zdGF0cycgfSxcbiAgICAgICAgICAgIG5vZGVfdHJlZTogeyBleGVjdXRvcjogdGhpcy5kZWJ1ZywgbWV0aG9kOiAnZ2V0X25vZGVfdHJlZScgfSxcbiAgICAgICAgICAgIGV4ZWN1dGVfc2NyaXB0OiB7IGV4ZWN1dG9yOiB0aGlzLmRlYnVnLCBtZXRob2Q6ICdleGVjdXRlX3NjcmlwdCcgfVxuICAgICAgICB9LFxuICAgICAgICB2YWxpZGF0aW9uOiB7XG4gICAgICAgICAgICB2YWxpZGF0ZV9zY2VuZTogeyBleGVjdXRvcjogdGhpcy5kZWJ1ZywgbWV0aG9kOiAndmFsaWRhdGVfc2NlbmUnIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnY29uc29sZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDb25zb2xlIGxvZyBhY2Nlc3MnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuY29uc29sZSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2xvZ3MnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUHJvamVjdCBsb2cgYWNjZXNzIGFuZCBzZWFyY2gnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMubG9ncyksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3N5c3RlbScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFZGl0b3Ivc3lzdGVtIGRpYWdub3N0aWNzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnN5c3RlbSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZhbGlkYXRpb24nLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRGVidWcgdmFsaWRhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMudmFsaWRhdGlvbiksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBleGVjdXRlQWN0aW9uKHRvb2xOYW1lLCBhcmdzLCB0aGlzLmFjdGlvbnMpO1xuICAgIH1cbn1cbiJdfQ==