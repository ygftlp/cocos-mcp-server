"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneViewCoreTools = void 0;
const scene_view_tools_1 = require("./scene-view-tools");
const core_action_utils_1 = require("./core-action-utils");
class SceneViewCoreTools {
    constructor() {
        this.sceneView = new scene_view_tools_1.SceneViewTools();
        this.actions = {
            control: {
                change_gizmo_tool: { executor: this.sceneView, method: 'change_gizmo_tool' },
                query_gizmo_tool: { executor: this.sceneView, method: 'query_gizmo_tool_name' },
                change_gizmo_pivot: { executor: this.sceneView, method: 'change_gizmo_pivot' },
                query_gizmo_pivot: { executor: this.sceneView, method: 'query_gizmo_pivot' },
                query_gizmo_view_mode: { executor: this.sceneView, method: 'query_gizmo_view_mode' },
                change_gizmo_coordinate: { executor: this.sceneView, method: 'change_gizmo_coordinate' },
                query_gizmo_coordinate: { executor: this.sceneView, method: 'query_gizmo_coordinate' },
                change_view_mode: { executor: this.sceneView, method: 'change_view_mode_2d_3d' },
                query_view_mode: { executor: this.sceneView, method: 'query_view_mode_2d_3d' },
                set_grid_visible: { executor: this.sceneView, method: 'set_grid_visible' },
                query_grid_visible: { executor: this.sceneView, method: 'query_grid_visible' },
                set_icon_gizmo_3d: { executor: this.sceneView, method: 'set_icon_gizmo_3d' },
                query_icon_gizmo_3d: { executor: this.sceneView, method: 'query_icon_gizmo_3d' },
                set_icon_gizmo_size: { executor: this.sceneView, method: 'set_icon_gizmo_size' },
                query_icon_gizmo_size: { executor: this.sceneView, method: 'query_icon_gizmo_size' }
            },
            tools: {
                focus_on_nodes: { executor: this.sceneView, method: 'focus_camera_on_nodes' },
                align_camera_with_view: { executor: this.sceneView, method: 'align_camera_with_view' },
                align_view_with_node: { executor: this.sceneView, method: 'align_view_with_node' },
                status: { executor: this.sceneView, method: 'get_scene_view_status' },
                reset: { executor: this.sceneView, method: 'reset_scene_view' }
            }
        };
    }
    getTools() {
        return [
            {
                name: 'control',
                description: 'Scene view controls and gizmo settings',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.control), 'Parameters for the selected action')
            },
            {
                name: 'tools',
                description: 'Scene view tools (focus/align/status)',
                inputSchema: (0, core_action_utils_1.buildActionSchema)(Object.keys(this.actions.tools), 'Parameters for the selected action')
            }
        ];
    }
    async execute(toolName, args) {
        return (0, core_action_utils_1.executeAction)(toolName, args, this.actions);
    }
}
exports.SceneViewCoreTools = SceneViewCoreTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29yZS1zY2VuZS12aWV3LXRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc291cmNlL3Rvb2xzL2NvcmUtc2NlbmUtdmlldy10b29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx5REFBb0Q7QUFDcEQsMkRBQXNGO0FBRXRGLE1BQWEsa0JBQWtCO0lBQS9CO1FBQ1ksY0FBUyxHQUFHLElBQUksaUNBQWMsRUFBRSxDQUFDO1FBRWpDLFlBQU8sR0FBa0I7WUFDN0IsT0FBTyxFQUFFO2dCQUNMLGlCQUFpQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUM1RSxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRTtnQkFDL0Usa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUU7Z0JBQzlFLGlCQUFpQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUM1RSxxQkFBcUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRTtnQkFDcEYsdUJBQXVCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUseUJBQXlCLEVBQUU7Z0JBQ3hGLHNCQUFzQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHdCQUF3QixFQUFFO2dCQUN0RixnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx3QkFBd0IsRUFBRTtnQkFDaEYsZUFBZSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHVCQUF1QixFQUFFO2dCQUM5RSxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtnQkFDMUUsa0JBQWtCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUU7Z0JBQzlFLGlCQUFpQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLG1CQUFtQixFQUFFO2dCQUM1RSxtQkFBbUIsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxxQkFBcUIsRUFBRTtnQkFDaEYsbUJBQW1CLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUscUJBQXFCLEVBQUU7Z0JBQ2hGLHFCQUFxQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHVCQUF1QixFQUFFO2FBQ3ZGO1lBQ0QsS0FBSyxFQUFFO2dCQUNILGNBQWMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSx1QkFBdUIsRUFBRTtnQkFDN0Usc0JBQXNCLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsd0JBQXdCLEVBQUU7Z0JBQ3RGLG9CQUFvQixFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLHNCQUFzQixFQUFFO2dCQUNsRixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQUUsdUJBQXVCLEVBQUU7Z0JBQ3JFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTthQUNsRTtTQUNKLENBQUM7SUFvQk4sQ0FBQztJQWxCRyxRQUFRO1FBQ0osT0FBTztZQUNIO2dCQUNJLElBQUksRUFBRSxTQUFTO2dCQUNmLFdBQVcsRUFBRSx3Q0FBd0M7Z0JBQ3JELFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUMxRztZQUNEO2dCQUNJLElBQUksRUFBRSxPQUFPO2dCQUNiLFdBQVcsRUFBRSx1Q0FBdUM7Z0JBQ3BELFdBQVcsRUFBRSxJQUFBLHFDQUFpQixFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxvQ0FBb0MsQ0FBQzthQUN4RztTQUNKLENBQUM7SUFDTixDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFnQixFQUFFLElBQVM7UUFDckMsT0FBTyxJQUFBLGlDQUFhLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdkQsQ0FBQztDQUNKO0FBaERELGdEQWdEQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHYxLjUgY29yZSBzY2VuZSB2aWV3IHRvb2xzOiBhY3Rpb24tYmFzZWQgZmFjYWRlLlxuaW1wb3J0IHsgVG9vbERlZmluaXRpb24sIFRvb2xFeGVjdXRvciwgVG9vbFJlc3BvbnNlIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgU2NlbmVWaWV3VG9vbHMgfSBmcm9tICcuL3NjZW5lLXZpZXctdG9vbHMnO1xuaW1wb3J0IHsgYnVpbGRBY3Rpb25TY2hlbWEsIGV4ZWN1dGVBY3Rpb24sIFRvb2xBY3Rpb25NYXAgfSBmcm9tICcuL2NvcmUtYWN0aW9uLXV0aWxzJztcblxuZXhwb3J0IGNsYXNzIFNjZW5lVmlld0NvcmVUb29scyBpbXBsZW1lbnRzIFRvb2xFeGVjdXRvciB7XG4gICAgcHJpdmF0ZSBzY2VuZVZpZXcgPSBuZXcgU2NlbmVWaWV3VG9vbHMoKTtcblxuICAgIHByaXZhdGUgYWN0aW9uczogVG9vbEFjdGlvbk1hcCA9IHtcbiAgICAgICAgY29udHJvbDoge1xuICAgICAgICAgICAgY2hhbmdlX2dpem1vX3Rvb2w6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdjaGFuZ2VfZ2l6bW9fdG9vbCcgfSxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX3Rvb2w6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdxdWVyeV9naXptb190b29sX25hbWUnIH0sXG4gICAgICAgICAgICBjaGFuZ2VfZ2l6bW9fcGl2b3Q6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdjaGFuZ2VfZ2l6bW9fcGl2b3QnIH0sXG4gICAgICAgICAgICBxdWVyeV9naXptb19waXZvdDogeyBleGVjdXRvcjogdGhpcy5zY2VuZVZpZXcsIG1ldGhvZDogJ3F1ZXJ5X2dpem1vX3Bpdm90JyB9LFxuICAgICAgICAgICAgcXVlcnlfZ2l6bW9fdmlld19tb2RlOiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAncXVlcnlfZ2l6bW9fdmlld19tb2RlJyB9LFxuICAgICAgICAgICAgY2hhbmdlX2dpem1vX2Nvb3JkaW5hdGU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdjaGFuZ2VfZ2l6bW9fY29vcmRpbmF0ZScgfSxcbiAgICAgICAgICAgIHF1ZXJ5X2dpem1vX2Nvb3JkaW5hdGU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdxdWVyeV9naXptb19jb29yZGluYXRlJyB9LFxuICAgICAgICAgICAgY2hhbmdlX3ZpZXdfbW9kZTogeyBleGVjdXRvcjogdGhpcy5zY2VuZVZpZXcsIG1ldGhvZDogJ2NoYW5nZV92aWV3X21vZGVfMmRfM2QnIH0sXG4gICAgICAgICAgICBxdWVyeV92aWV3X21vZGU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdxdWVyeV92aWV3X21vZGVfMmRfM2QnIH0sXG4gICAgICAgICAgICBzZXRfZ3JpZF92aXNpYmxlOiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAnc2V0X2dyaWRfdmlzaWJsZScgfSxcbiAgICAgICAgICAgIHF1ZXJ5X2dyaWRfdmlzaWJsZTogeyBleGVjdXRvcjogdGhpcy5zY2VuZVZpZXcsIG1ldGhvZDogJ3F1ZXJ5X2dyaWRfdmlzaWJsZScgfSxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vXzNkOiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAnc2V0X2ljb25fZ2l6bW9fM2QnIH0sXG4gICAgICAgICAgICBxdWVyeV9pY29uX2dpem1vXzNkOiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAncXVlcnlfaWNvbl9naXptb18zZCcgfSxcbiAgICAgICAgICAgIHNldF9pY29uX2dpem1vX3NpemU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdzZXRfaWNvbl9naXptb19zaXplJyB9LFxuICAgICAgICAgICAgcXVlcnlfaWNvbl9naXptb19zaXplOiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAncXVlcnlfaWNvbl9naXptb19zaXplJyB9XG4gICAgICAgIH0sXG4gICAgICAgIHRvb2xzOiB7XG4gICAgICAgICAgICBmb2N1c19vbl9ub2RlczogeyBleGVjdXRvcjogdGhpcy5zY2VuZVZpZXcsIG1ldGhvZDogJ2ZvY3VzX2NhbWVyYV9vbl9ub2RlcycgfSxcbiAgICAgICAgICAgIGFsaWduX2NhbWVyYV93aXRoX3ZpZXc6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdhbGlnbl9jYW1lcmFfd2l0aF92aWV3JyB9LFxuICAgICAgICAgICAgYWxpZ25fdmlld193aXRoX25vZGU6IHsgZXhlY3V0b3I6IHRoaXMuc2NlbmVWaWV3LCBtZXRob2Q6ICdhbGlnbl92aWV3X3dpdGhfbm9kZScgfSxcbiAgICAgICAgICAgIHN0YXR1czogeyBleGVjdXRvcjogdGhpcy5zY2VuZVZpZXcsIG1ldGhvZDogJ2dldF9zY2VuZV92aWV3X3N0YXR1cycgfSxcbiAgICAgICAgICAgIHJlc2V0OiB7IGV4ZWN1dG9yOiB0aGlzLnNjZW5lVmlldywgbWV0aG9kOiAncmVzZXRfc2NlbmVfdmlldycgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGdldFRvb2xzKCk6IFRvb2xEZWZpbml0aW9uW10ge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICdjb250cm9sJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NjZW5lIHZpZXcgY29udHJvbHMgYW5kIGdpem1vIHNldHRpbmdzJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLmNvbnRyb2wpLCAnUGFyYW1ldGVycyBmb3IgdGhlIHNlbGVjdGVkIGFjdGlvbicpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6ICd0b29scycsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTY2VuZSB2aWV3IHRvb2xzIChmb2N1cy9hbGlnbi9zdGF0dXMpJyxcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYTogYnVpbGRBY3Rpb25TY2hlbWEoT2JqZWN0LmtleXModGhpcy5hY3Rpb25zLnRvb2xzKSwgJ1BhcmFtZXRlcnMgZm9yIHRoZSBzZWxlY3RlZCBhY3Rpb24nKVxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgIH1cblxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogYW55KTogUHJvbWlzZTxUb29sUmVzcG9uc2U+IHtcbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVBY3Rpb24odG9vbE5hbWUsIGFyZ3MsIHRoaXMuYWN0aW9ucyk7XG4gICAgfVxufVxuIl19