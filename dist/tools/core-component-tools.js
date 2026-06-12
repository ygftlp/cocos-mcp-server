"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentCoreTools = void 0;
const component_tools_1 = require("./component-tools");
const scene_advanced_tools_1 = require("./scene-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class ComponentCoreTools {
    constructor() {
        this.component = new component_tools_1.ComponentTools();
        this.advanced = new scene_advanced_tools_1.SceneAdvancedTools();
        this.actions = {
            manage: {
                add: { executor: this.component, method: 'add_component' },
                remove: { executor: this.component, method: 'remove_component' },
                list_available: { executor: this.component, method: 'get_available_components' }
            },
            script: {
                attach: { executor: this.component, method: 'attach_script' },
                remove: { executor: this.component, method: 'remove_component' },
                has_script: { executor: this.advanced, method: 'query_component_has_script' }
            },
            query: {
                list: { executor: this.component, method: 'get_components' },
                info: { executor: this.component, method: 'get_component_info' },
                has_script: { executor: this.advanced, method: 'query_component_has_script' }
            },
            property: {
                set: { executor: this.component, method: 'set_component_property' },
                reset: { executor: this.advanced, method: 'reset_component' }
            },
            event: {
                execute_method: { executor: this.advanced, method: 'execute_component_method' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'manage',
                description: 'Manage components (add/remove/list available)',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'script',
                description: 'Script component operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.script), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Query components on node',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'property',
                description: 'Component property operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.property), 'Parameters for the selected action')
            },
            {
                name: 'event',
                description: 'Execute component methods',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.event), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.ComponentCoreTools = ComponentCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1jb21wb25lbnQtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1jb21wb25lbnQtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsdURBQW1EO0FBQ25ELGlFQUE0RDtBQUM1RCwyREFBc0Y7QUFFdEYsTUFBYSxrQkFBa0I7SUFBL0I7UUFDWSxjQUFTLEdBQUcsSUFBSSxnQ0FBYyxFQUFFLENBQUM7UUFDakMsYUFBUSxHQUFHLElBQUkseUNBQWtCLEVBQUUsQ0FBQztRQUVwQyxZQUFPLEdBQWtCO1lBQzdCLE1BQU0sRUFBRTtnQkFDSixHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUMxRCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQ2hFLGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTthQUNuRjtZQUNELE1BQU0sRUFBRTtnQkFDSixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUM3RCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7Z0JBQ2hFLFVBQVUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSw0QkFBNEIsRUFBRTthQUNoRjtZQUNELEtBQUssRUFBRTtnQkFDSCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7Z0JBQzVELElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxvQkFBb0IsRUFBRTtnQkFDaEUsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLDRCQUE0QixFQUFFO2FBQ2hGO1lBQ0QsUUFBUSxFQUFFO2dCQUNOLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx3QkFBd0IsRUFBRTtnQkFDbkUsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFO2FBQ2hFO1lBQ0QsS0FBSyxFQUFFO2dCQUNILGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTthQUNsRjtTQUNKLENBQUM7SUFtQ04sQ0FBQztJQWpDRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSwrQ0FBK0M7Z0JBQzVELFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN6RztZQUNEO2dCQUNJLElBQUksRUFBRSxRQUFRO2dCQUNkLFdBQVcsRUFBRSw2QkFBNkI7Z0JBQzFDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN6RztZQUNEO2dCQUNJLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSwwQkFBMEI7Z0JBQ3ZDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN4RztZQUNEO2dCQUNJLElBQUksRUFBRSxVQUFVO2dCQUNoQixXQUFXLEVBQUUsK0JBQStCO2dCQUM1QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDM0c7WUFDRDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsMkJBQTJCO2dCQUN4QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDeEc7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1FBQ3JDLE9BQU8sSUFBQSxpQ0FBYSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDSjtBQTlERCxnREE4REMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB2MS41IGNvcmUgY29tcG9uZW50IHRvb2xzOiBhY3Rpb24tYmFzZWQgZmFjYWRlLlxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xFeGVjdXRvciwgVG9vbFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50VG9vbHMgfSBmcm9tICcuL2NvbXBvbmVudC10b29scyc7XG5pbXBvcnQgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3NjZW5lLWFkdmFuY2VkLXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgY29tcG9uZW50ID0gbmV3IENvbXBvbmVudFRvb2xzKCk7XG4gICAgcHJpdmF0ZSBhZHZhbmNlZCA9IG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgbWFuYWdlOiB7XG4gICAgICAgICAgICBhZGQ6IHsgZXhlY3V0b3I6IHRoaXMuY29tcG9uZW50LCBtZXRob2Q6ICdhZGRfY29tcG9uZW50JyB9LFxuICAgICAgICAgICAgcmVtb3ZlOiB7IGV4ZWN1dG9yOiB0aGlzLmNvbXBvbmVudCwgbWV0aG9kOiAncmVtb3ZlX2NvbXBvbmVudCcgfSxcbiAgICAgICAgICAgIGxpc3RfYXZhaWxhYmxlOiB7IGV4ZWN1dG9yOiB0aGlzLmNvbXBvbmVudCwgbWV0aG9kOiAnZ2V0X2F2YWlsYWJsZV9jb21wb25lbnRzJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHNjcmlwdDoge1xuICAgICAgICAgICAgYXR0YWNoOiB7IGV4ZWN1dG9yOiB0aGlzLmNvbXBvbmVudCwgbWV0aG9kOiAnYXR0YWNoX3NjcmlwdCcgfSxcbiAgICAgICAgICAgIHJlbW92ZTogeyBleGVjdXRvcjogdGhpcy5jb21wb25lbnQsIG1ldGhvZDogJ3JlbW92ZV9jb21wb25lbnQnIH0sXG4gICAgICAgICAgICBoYXNfc2NyaXB0OiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdxdWVyeV9jb21wb25lbnRfaGFzX3NjcmlwdCcgfVxuICAgICAgICB9LFxuICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgbGlzdDogeyBleGVjdXRvcjogdGhpcy5jb21wb25lbnQsIG1ldGhvZDogJ2dldF9jb21wb25lbnRzJyB9LFxuICAgICAgICAgICAgaW5mbzogeyBleGVjdXRvcjogdGhpcy5jb21wb25lbnQsIG1ldGhvZDogJ2dldF9jb21wb25lbnRfaW5mbycgfSxcbiAgICAgICAgICAgIGhhc19zY3JpcHQ6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3F1ZXJ5X2NvbXBvbmVudF9oYXNfc2NyaXB0JyB9XG4gICAgICAgIH0sXG4gICAgICAgIHByb3BlcnR5OiB7XG4gICAgICAgICAgICBzZXQ6IHsgZXhlY3V0b3I6IHRoaXMuY29tcG9uZW50LCBtZXRob2Q6ICdzZXRfY29tcG9uZW50X3Byb3BlcnR5JyB9LFxuICAgICAgICAgICAgcmVzZXQ6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3Jlc2V0X2NvbXBvbmVudCcgfVxuICAgICAgICB9LFxuICAgICAgICBldmVudDoge1xuICAgICAgICAgICAgZXhlY3V0ZV9tZXRob2Q6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ2V4ZWN1dGVfY29tcG9uZW50X21ldGhvZCcgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdtYW5hZ2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTWFuYWdlIGNvbXBvbmVudHMgKGFkZC9yZW1vdmUvbGlzdCBhdmFpbGFibGUpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLm1hbmFnZSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY3JpcHQgY29tcG9uZW50IG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuc2NyaXB0KSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncXVlcnknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnUXVlcnkgY29tcG9uZW50cyBvbiBub2RlJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnF1ZXJ5KSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAncHJvcGVydHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcG9uZW50IHByb3BlcnR5IG9wZXJhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMucHJvcGVydHkpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdldmVudCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdFeGVjdXRlIGNvbXBvbmVudCBtZXRob2RzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmV2ZW50KSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVBY3Rpb24odG9vbE5hbWUsIGFyZ3MsIHRoaXMuYWN0aW9ucyk7XG4gICAgfVxufVxuIl19