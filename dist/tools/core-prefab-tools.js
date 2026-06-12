"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefabCoreTools = void 0;
const prefab_tools_1 = require("./prefab-tools");
const scene_advanced_tools_1 = require("./scene-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class PrefabCoreTools {
    constructor() {
        this.prefab = new prefab_tools_1.PrefabTools();
        this.advanced = new scene_advanced_tools_1.SceneAdvancedTools();
        this.actions = {
            browse: {
                list: { executor: this.prefab, method: 'get_prefab_list' },
                info: { executor: this.prefab, method: 'get_prefab_info' },
                validate: { executor: this.prefab, method: 'validate_prefab' },
                load: { executor: this.prefab, method: 'load_prefab' }
            },
            lifecycle: {
                create: { executor: this.prefab, method: 'create_prefab' },
                update: { executor: this.prefab, method: 'update_prefab' },
                duplicate: { executor: this.prefab, method: 'duplicate_prefab' }
            },
            instance: {
                instantiate: { executor: this.prefab, method: 'instantiate_prefab' },
                revert: { executor: this.prefab, method: 'revert_prefab' },
                restore_node: { executor: this.prefab, method: 'restore_prefab_node' }
            },
            edit: {
                restore_prefab: { executor: this.advanced, method: 'restore_prefab' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'browse',
                description: 'Browse and inspect prefabs',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.browse), 'Parameters for the selected action')
            },
            {
                name: 'lifecycle',
                description: 'Prefab create/update/duplicate',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.lifecycle), 'Parameters for the selected action')
            },
            {
                name: 'instance',
                description: 'Prefab instantiation and revert',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.instance), 'Parameters for the selected action')
            },
            {
                name: 'edit',
                description: 'Prefab edit operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.edit), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.PrefabCoreTools = PrefabCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1wcmVmYWItdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvY29yZS1wcmVmYWItdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsaURBQTZDO0FBQzdDLGlFQUE0RDtBQUM1RCwyREFBc0Y7QUFFdEYsTUFBYSxlQUFlO0lBQTVCO1FBQ1ksV0FBTSxHQUFHLElBQUksMEJBQVcsRUFBRSxDQUFDO1FBQzNCLGFBQVEsR0FBRyxJQUFJLHlDQUFrQixFQUFFLENBQUM7UUFFcEMsWUFBTyxHQUFrQjtZQUM3QixNQUFNLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLGlCQUFpQixFQUFFO2dCQUMxRCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUU7Z0JBQzFELFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxpQkFBaUIsRUFBRTtnQkFDOUQsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRTthQUN6RDtZQUNELFNBQVMsRUFBRTtnQkFDUCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUMxRCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUMxRCxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7YUFDbkU7WUFDRCxRQUFRLEVBQUU7Z0JBQ04sV0FBVyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFO2dCQUNwRSxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUMxRCxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7YUFDekU7WUFDRCxJQUFJLEVBQUU7Z0JBQ0YsY0FBYyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFO2FBQ3hFO1NBQ0osQ0FBQztJQThCTixDQUFDO0lBNUJHLFFBQVE7UUFDSixPQUFPO1lBQ0g7Z0JBQ0ksSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsV0FBVyxFQUFFLDRCQUE0QjtnQkFDekMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQ3pHO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFdBQVcsRUFBRSxnQ0FBZ0M7Z0JBQzdDLFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUM1RztZQUNEO2dCQUNJLElBQUksRUFBRSxVQUFVO2dCQUNoQixXQUFXLEVBQUUsaUNBQWlDO2dCQUM5QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDM0c7WUFDRDtnQkFDSSxJQUFJLEVBQUUsTUFBTTtnQkFDWixXQUFXLEVBQUUsd0JBQXdCO2dCQUNyQyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDdkc7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1FBQ3JDLE9BQU8sSUFBQSxpQ0FBYSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDSjtBQXRERCwwQ0FzREMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB2MS41IGNvcmUgcHJlZmFiIHRvb2xzOiBhY3Rpb24tYmFzZWQgZmFjYWRlLlxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xFeGVjdXRvciwgVG9vbFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgUHJlZmFiVG9vbHMgfSBmcm9tICcuL3ByZWZhYi10b29scyc7XG5pbXBvcnQgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3NjZW5lLWFkdmFuY2VkLXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBQcmVmYWJDb3JlVG9vbHMgaW1wbGVtZW50cyBUb29sRXhlY3V0b3Ige1xuICAgIHByaXZhdGUgcHJlZmFiID0gbmV3IFByZWZhYlRvb2xzKCk7XG4gICAgcHJpdmF0ZSBhZHZhbmNlZCA9IG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgYnJvd3NlOiB7XG4gICAgICAgICAgICBsaXN0OiB7IGV4ZWN1dG9yOiB0aGlzLnByZWZhYiwgbWV0aG9kOiAnZ2V0X3ByZWZhYl9saXN0JyB9LFxuICAgICAgICAgICAgaW5mbzogeyBleGVjdXRvcjogdGhpcy5wcmVmYWIsIG1ldGhvZDogJ2dldF9wcmVmYWJfaW5mbycgfSxcbiAgICAgICAgICAgIHZhbGlkYXRlOiB7IGV4ZWN1dG9yOiB0aGlzLnByZWZhYiwgbWV0aG9kOiAndmFsaWRhdGVfcHJlZmFiJyB9LFxuICAgICAgICAgICAgbG9hZDogeyBleGVjdXRvcjogdGhpcy5wcmVmYWIsIG1ldGhvZDogJ2xvYWRfcHJlZmFiJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGxpZmVjeWNsZToge1xuICAgICAgICAgICAgY3JlYXRlOiB7IGV4ZWN1dG9yOiB0aGlzLnByZWZhYiwgbWV0aG9kOiAnY3JlYXRlX3ByZWZhYicgfSxcbiAgICAgICAgICAgIHVwZGF0ZTogeyBleGVjdXRvcjogdGhpcy5wcmVmYWIsIG1ldGhvZDogJ3VwZGF0ZV9wcmVmYWInIH0sXG4gICAgICAgICAgICBkdXBsaWNhdGU6IHsgZXhlY3V0b3I6IHRoaXMucHJlZmFiLCBtZXRob2Q6ICdkdXBsaWNhdGVfcHJlZmFiJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGluc3RhbmNlOiB7XG4gICAgICAgICAgICBpbnN0YW50aWF0ZTogeyBleGVjdXRvcjogdGhpcy5wcmVmYWIsIG1ldGhvZDogJ2luc3RhbnRpYXRlX3ByZWZhYicgfSxcbiAgICAgICAgICAgIHJldmVydDogeyBleGVjdXRvcjogdGhpcy5wcmVmYWIsIG1ldGhvZDogJ3JldmVydF9wcmVmYWInIH0sXG4gICAgICAgICAgICByZXN0b3JlX25vZGU6IHsgZXhlY3V0b3I6IHRoaXMucHJlZmFiLCBtZXRob2Q6ICdyZXN0b3JlX3ByZWZhYl9ub2RlJyB9XG4gICAgICAgIH0sXG4gICAgICAgIGVkaXQ6IHtcbiAgICAgICAgICAgIHJlc3RvcmVfcHJlZmFiOiB7IGV4ZWN1dG9yOiB0aGlzLmFkdmFuY2VkLCBtZXRob2Q6ICdyZXN0b3JlX3ByZWZhYicgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdicm93c2UnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQnJvd3NlIGFuZCBpbnNwZWN0IHByZWZhYnMnLFxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiBidWlsZEFjdGlvblNjaGVtYShPYmplY3Qua2V5cyh0aGlzLmFjdGlvbnMuYnJvd3NlKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnbGlmZWN5Y2xlJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ByZWZhYiBjcmVhdGUvdXBkYXRlL2R1cGxpY2F0ZScsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5saWZlY3ljbGUpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdpbnN0YW5jZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgaW5zdGFudGlhdGlvbiBhbmQgcmV2ZXJ0JyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmluc3RhbmNlKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiAnZWRpdCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdQcmVmYWIgZWRpdCBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmVkaXQpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9XG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgYXN5bmMgZXhlY3V0ZSh0b29sTmFtZTogc3RyaW5nLCBhcmdzOiBhbnkpOiBQcm9taXNlPFRvb2xSZXNwb25zZT4ge1xuICAgICAgICByZXR1cm4gZXhlY3V0ZUFjdGlvbih0b29sTmFtZSwgYXJncywgdGhpcy5hY3Rpb25zKTtcbiAgICB9XG59XG4iXX0=