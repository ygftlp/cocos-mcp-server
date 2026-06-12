// v1.5 core scene view tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { SceneViewTools } from './scene-view-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class SceneViewCoreTools implements ToolExecutor {
    private sceneView = new SceneViewTools();

    private actions: ToolActionMap = {
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

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'control',
                description: 'Scene view controls and gizmo settings',
                inputSchema: buildActionSchema(Object.keys(this.actions.control), 'Parameters for the selected action')
            },
            {
                name: 'tools',
                description: 'Scene view tools (focus/align/status)',
                inputSchema: buildActionSchema(Object.keys(this.actions.tools), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
