// v1.5 core scene tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { SceneTools } from './scene-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class SceneCoreTools implements ToolExecutor {
    private scene = new SceneTools();
    private advanced = new SceneAdvancedTools();

    private actions: ToolActionMap = {
        management: {
            current: { executor: this.scene, method: 'get_current_scene' },
            list: { executor: this.scene, method: 'get_scene_list' },
            open: { executor: this.scene, method: 'open_scene' },
            save: { executor: this.scene, method: 'save_scene' },
            create: { executor: this.scene, method: 'create_scene' },
            save_as: { executor: this.scene, method: 'save_scene_as' },
            close: { executor: this.scene, method: 'close_scene' }
        },
        hierarchy: {
            get: { executor: this.scene, method: 'get_scene_hierarchy' }
        },
        execution_control: {
            execute_component_method: { executor: this.advanced, method: 'execute_component_method' },
            execute_scene_script: { executor: this.advanced, method: 'execute_scene_script' },
            restore_prefab: { executor: this.advanced, method: 'restore_prefab' }
        },
        snapshot: {
            snapshot: { executor: this.advanced, method: 'scene_snapshot' },
            abort: { executor: this.advanced, method: 'scene_snapshot_abort' }
        },
        query: {
            ready: { executor: this.advanced, method: 'query_scene_ready' },
            dirty: { executor: this.advanced, method: 'query_scene_dirty' },
            classes: { executor: this.advanced, method: 'query_scene_classes' },
            components: { executor: this.advanced, method: 'query_scene_components' }
        },
        undo: {
            begin: { executor: this.advanced, method: 'begin_undo_recording' },
            end: { executor: this.advanced, method: 'end_undo_recording' },
            cancel: { executor: this.advanced, method: 'cancel_undo_recording' },
            soft_reload: { executor: this.advanced, method: 'soft_reload_scene' }
        }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'management',
                description: 'Scene management (current/list/open/save/create/close)',
                inputSchema: buildActionSchema(Object.keys(this.actions.management), 'Parameters for the selected action')
            },
            {
                name: 'hierarchy',
                description: 'Scene hierarchy access',
                inputSchema: buildActionSchema(Object.keys(this.actions.hierarchy), 'Parameters for the selected action')
            },
            {
                name: 'execution_control',
                description: 'Execute scene/component operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.execution_control), 'Parameters for the selected action')
            },
            {
                name: 'snapshot',
                description: 'Scene snapshot operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.snapshot), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Query scene status and metadata',
                inputSchema: buildActionSchema(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'undo',
                description: 'Undo/redo recording control',
                inputSchema: buildActionSchema(Object.keys(this.actions.undo), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
