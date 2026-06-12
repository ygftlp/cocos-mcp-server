"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCoreTools = void 0;
const node_tools_1 = require("./node-tools");
const scene_advanced_tools_1 = require("./scene-advanced-tools");
const core_action_utils_1 = require("./core-action-utils");
class NodeCoreTools {
    constructor() {
        this.node = new node_tools_1.NodeTools();
        this.advanced = new scene_advanced_tools_1.SceneAdvancedTools();
        this.actions = {
            query: {
                info: { executor: this.node, method: 'get_node_info' },
                find: { executor: this.node, method: 'find_nodes' },
                find_by_name: { executor: this.node, method: 'find_node_by_name' },
                list: { executor: this.node, method: 'get_all_nodes' },
                detect_type: { executor: this.node, method: 'detect_node_type' }
            },
            lifecycle: {
                create: { executor: this.node, method: 'create_node' },
                delete: { executor: this.node, method: 'delete_node' },
                duplicate: { executor: this.node, method: 'duplicate_node' },
                move: { executor: this.node, method: 'move_node' }
            },
            transform: {
                set_transform: { executor: this.node, method: 'set_node_transform' },
                set_property: { executor: this.node, method: 'set_node_property' }
            },
            hierarchy: {
                move: { executor: this.node, method: 'move_node' },
                duplicate: { executor: this.node, method: 'duplicate_node' },
                query_by_asset: { executor: this.advanced, method: 'query_nodes_by_asset_uuid' }
            },
            clipboard: {
                copy: { executor: this.advanced, method: 'copy_node' },
                cut: { executor: this.advanced, method: 'cut_node' },
                paste: { executor: this.advanced, method: 'paste_node' }
            },
            property_management: {
                reset_property: { executor: this.advanced, method: 'reset_node_property' },
                reset_transform: { executor: this.advanced, method: 'reset_node_transform' }
            },
            batch: {
                move_array_element: { executor: this.advanced, method: 'move_array_element' },
                remove_array_element: { executor: this.advanced, method: 'remove_array_element' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'query',
                description: 'Node query and lookup',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'lifecycle',
                description: 'Node lifecycle operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.lifecycle), 'Parameters for the selected action')
            },
            {
                name: 'transform',
                description: 'Node transform and property changes',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.transform), 'Parameters for the selected action')
            },
            {
                name: 'hierarchy',
                description: 'Node hierarchy operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.hierarchy), 'Parameters for the selected action')
            },
            {
                name: 'clipboard',
                description: 'Node clipboard operations',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.clipboard), 'Parameters for the selected action')
            },
            {
                name: 'property_management',
                description: 'Reset and manage node properties',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.property_management), 'Parameters for the selected action')
            },
            {
                name: 'batch',
                description: 'Batch array operations for nodes',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.batch), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
    clearCache() {
        if (typeof this.node.clearCache === 'function') {
            this.node.clearCache();
        }
    }
}
exports.NodeCoreTools = NodeCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1ub2RlLXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvcmUtbm9kZS10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSw2Q0FBeUM7QUFDekMsaUVBQTREO0FBQzVELDJEQUFzRjtBQUV0RixNQUFhLGFBQWE7SUFBMUI7UUFDWSxTQUFJLEdBQUcsSUFBSSxzQkFBUyxFQUFFLENBQUM7UUFDdkIsYUFBUSxHQUFHLElBQUkseUNBQWtCLEVBQUUsQ0FBQztRQUVwQyxZQUFPLEdBQWtCO1lBQzdCLEtBQUssRUFBRTtnQkFDSCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFO2dCQUN0RCxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFO2dCQUNuRCxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUU7Z0JBQ2xFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUU7Z0JBQ3RELFdBQVcsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTthQUNuRTtZQUNELFNBQVMsRUFBRTtnQkFDUCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2dCQUN0RCxNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFO2dCQUN0RCxTQUFTLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUU7Z0JBQzVELElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUU7YUFDckQ7WUFDRCxTQUFTLEVBQUU7Z0JBQ1AsYUFBYSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLG9CQUFvQixFQUFFO2dCQUNwRSxZQUFZLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUU7YUFDckU7WUFDRCxTQUFTLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtnQkFDbEQsU0FBUyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLGdCQUFnQixFQUFFO2dCQUM1RCxjQUFjLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsMkJBQTJCLEVBQUU7YUFDbkY7WUFDRCxTQUFTLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRTtnQkFDdEQsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRTtnQkFDcEQsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRTthQUMzRDtZQUNELG1CQUFtQixFQUFFO2dCQUNqQixjQUFjLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7Z0JBQzFFLGVBQWUsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxzQkFBc0IsRUFBRTthQUMvRTtZQUNELEtBQUssRUFBRTtnQkFDSCxrQkFBa0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxvQkFBb0IsRUFBRTtnQkFDN0Usb0JBQW9CLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsc0JBQXNCLEVBQUU7YUFDcEY7U0FDSixDQUFDO0lBbUROLENBQUM7SUFqREcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsdUJBQXVCO2dCQUNwQyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDeEc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsV0FBVztnQkFDakIsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQzVHO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFdBQVcsRUFBRSxxQ0FBcUM7Z0JBQ2xELFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUM1RztZQUNEO2dCQUNJLElBQUksRUFBRSxXQUFXO2dCQUNqQixXQUFXLEVBQUUsMkJBQTJCO2dCQUN4QyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDNUc7WUFDRDtnQkFDSSxJQUFJLEVBQUUsV0FBVztnQkFDakIsV0FBVyxFQUFFLDJCQUEyQjtnQkFDeEMsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFLG9DQUFvQyxDQUFDO2FBQzVHO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtnQkFDM0IsV0FBVyxFQUFFLGtDQUFrQztnQkFDL0MsV0FBVyxFQUFFLElBQUEscUNBQWlCLEVBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDdEg7WUFDRDtnQkFDSSxJQUFJLEVBQUUsT0FBTztnQkFDYixXQUFXLEVBQUUsa0NBQWtDO2dCQUMvQyxXQUFXLEVBQUUsSUFBQSxxQ0FBaUIsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsb0NBQW9DLENBQUM7YUFDeEc7U0FDSixDQUFDO0lBQ04sQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBZ0IsRUFBRSxJQUFTO1FBQ3JDLE9BQU8sSUFBQSxpQ0FBYSxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFTSxVQUFVO1FBQ2IsSUFBSSxPQUFRLElBQUksQ0FBQyxJQUFZLENBQUMsVUFBVSxLQUFLLFVBQVUsRUFBRSxDQUFDO1lBQ3JELElBQUksQ0FBQyxJQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDcEMsQ0FBQztJQUNMLENBQUM7Q0FDSjtBQTNGRCxzQ0EyRkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB2MS41IGNvcmUgbm9kZSB0b29sczogYWN0aW9uLWJhc2VkIGZhY2FkZS5cbmltcG9ydCB7IFRvb2xEZWZpbml0aW9uLCBUb29sRXhlY3V0b3IsIFRvb2xSZXNwb25zZSB9IGZyb20gJy4uL3R5cGVzJztcbmltcG9ydCB7IE5vZGVUb29scyB9IGZyb20gJy4vbm9kZS10b29scyc7XG5pbXBvcnQgeyBTY2VuZUFkdmFuY2VkVG9vbHMgfSBmcm9tICcuL3NjZW5lLWFkdmFuY2VkLXRvb2xzJztcbmltcG9ydCB7IGJ1aWxkQWN0aW9uU2NoZW1hLCBleGVjdXRlQWN0aW9uLCBUb29sQWN0aW9uTWFwIH0gZnJvbSAnLi9jb3JlLWFjdGlvbi11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBOb2RlQ29yZVRvb2xzIGltcGxlbWVudHMgVG9vbEV4ZWN1dG9yIHtcbiAgICBwcml2YXRlIG5vZGUgPSBuZXcgTm9kZVRvb2xzKCk7XG4gICAgcHJpdmF0ZSBhZHZhbmNlZCA9IG5ldyBTY2VuZUFkdmFuY2VkVG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIGluZm86IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZ2V0X25vZGVfaW5mbycgfSxcbiAgICAgICAgICAgIGZpbmQ6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZmluZF9ub2RlcycgfSxcbiAgICAgICAgICAgIGZpbmRfYnlfbmFtZTogeyBleGVjdXRvcjogdGhpcy5ub2RlLCBtZXRob2Q6ICdmaW5kX25vZGVfYnlfbmFtZScgfSxcbiAgICAgICAgICAgIGxpc3Q6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZ2V0X2FsbF9ub2RlcycgfSxcbiAgICAgICAgICAgIGRldGVjdF90eXBlOiB7IGV4ZWN1dG9yOiB0aGlzLm5vZGUsIG1ldGhvZDogJ2RldGVjdF9ub2RlX3R5cGUnIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGlmZWN5Y2xlOiB7XG4gICAgICAgICAgICBjcmVhdGU6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnY3JlYXRlX25vZGUnIH0sXG4gICAgICAgICAgICBkZWxldGU6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZGVsZXRlX25vZGUnIH0sXG4gICAgICAgICAgICBkdXBsaWNhdGU6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZHVwbGljYXRlX25vZGUnIH0sXG4gICAgICAgICAgICBtb3ZlOiB7IGV4ZWN1dG9yOiB0aGlzLm5vZGUsIG1ldGhvZDogJ21vdmVfbm9kZScgfVxuICAgICAgICB9LFxuICAgICAgICB0cmFuc2Zvcm06IHtcbiAgICAgICAgICAgIHNldF90cmFuc2Zvcm06IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnc2V0X25vZGVfdHJhbnNmb3JtJyB9LFxuICAgICAgICAgICAgc2V0X3Byb3BlcnR5OiB7IGV4ZWN1dG9yOiB0aGlzLm5vZGUsIG1ldGhvZDogJ3NldF9ub2RlX3Byb3BlcnR5JyB9XG4gICAgICAgIH0sXG4gICAgICAgIGhpZXJhcmNoeToge1xuICAgICAgICAgICAgbW92ZTogeyBleGVjdXRvcjogdGhpcy5ub2RlLCBtZXRob2Q6ICdtb3ZlX25vZGUnIH0sXG4gICAgICAgICAgICBkdXBsaWNhdGU6IHsgZXhlY3V0b3I6IHRoaXMubm9kZSwgbWV0aG9kOiAnZHVwbGljYXRlX25vZGUnIH0sXG4gICAgICAgICAgICBxdWVyeV9ieV9hc3NldDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAncXVlcnlfbm9kZXNfYnlfYXNzZXRfdXVpZCcgfVxuICAgICAgICB9LFxuICAgICAgICBjbGlwYm9hcmQ6IHtcbiAgICAgICAgICAgIGNvcHk6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ2NvcHlfbm9kZScgfSxcbiAgICAgICAgICAgIGN1dDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnY3V0X25vZGUnIH0sXG4gICAgICAgICAgICBwYXN0ZTogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAncGFzdGVfbm9kZScgfVxuICAgICAgICB9LFxuICAgICAgICBwcm9wZXJ0eV9tYW5hZ2VtZW50OiB7XG4gICAgICAgICAgICByZXNldF9wcm9wZXJ0eTogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAncmVzZXRfbm9kZV9wcm9wZXJ0eScgfSxcbiAgICAgICAgICAgIHJlc2V0X3RyYW5zZm9ybTogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAncmVzZXRfbm9kZV90cmFuc2Zvcm0nIH1cbiAgICAgICAgfSxcbiAgICAgICAgYmF0Y2g6IHtcbiAgICAgICAgICAgIG1vdmVfYXJyYXlfZWxlbWVudDogeyBleGVjdXRvcjogdGhpcy5hZHZhbmNlZCwgbWV0aG9kOiAnbW92ZV9hcnJheV9lbGVtZW50JyB9LFxuICAgICAgICAgICAgcmVtb3ZlX2FycmF5X2VsZW1lbnQ6IHsgZXhlY3V0b3I6IHRoaXMuYWR2YW5jZWQsIG1ldGhvZDogJ3JlbW92ZV9hcnJheV9lbGVtZW50JyB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZ2V0VG9vbHMoKTogVG9vbERlZmluaXRpb25bXSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3F1ZXJ5JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ05vZGUgcXVlcnkgYW5kIGxvb2t1cCcsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5xdWVyeSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2xpZmVjeWNsZScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIGxpZmVjeWNsZSBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmxpZmVjeWNsZSksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3RyYW5zZm9ybScsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdOb2RlIHRyYW5zZm9ybSBhbmQgcHJvcGVydHkgY2hhbmdlcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy50cmFuc2Zvcm0pLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdoaWVyYXJjaHknLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBoaWVyYXJjaHkgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5oaWVyYXJjaHkpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjbGlwYm9hcmQnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTm9kZSBjbGlwYm9hcmQgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5jbGlwYm9hcmQpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdwcm9wZXJ0eV9tYW5hZ2VtZW50JyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1Jlc2V0IGFuZCBtYW5hZ2Ugbm9kZSBwcm9wZXJ0aWVzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnByb3BlcnR5X21hbmFnZW1lbnQpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdiYXRjaCcsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCYXRjaCBhcnJheSBvcGVyYXRpb25zIGZvciBub2RlcycsXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IGJ1aWxkQWN0aW9uU2NoZW1hKE9iamVjdC5rZXlzKHRoaXMuYWN0aW9ucy5iYXRjaCksICdQYXJhbWV0ZXJzIGZvciB0aGUgc2VsZWN0ZWQgYWN0aW9uJylcbiAgICAgICAgICAgIH1cbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBhc3luYyBleGVjdXRlKHRvb2xOYW1lOiBzdHJpbmcsIGFyZ3M6IGFueSk6IFByb21pc2U8VG9vbFJlc3BvbnNlPiB7XG4gICAgICAgIHJldHVybiBleGVjdXRlQWN0aW9uKHRvb2xOYW1lLCBhcmdzLCB0aGlzLmFjdGlvbnMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbGVhckNhY2hlKCk6IHZvaWQge1xuICAgICAgICBpZiAodHlwZW9mICh0aGlzLm5vZGUgYXMgYW55KS5jbGVhckNhY2hlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAodGhpcy5ub2RlIGFzIGFueSkuY2xlYXJDYWNoZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19