import { SceneAdvancedAdapter } from '../adapters/contracts/scene-advanced-adapter';
import { SceneAdapter } from '../adapters/contracts/scene-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { SceneTools } from './scene-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class SceneCoreTools implements ToolExecutor {
    private readonly scene: SceneTools;
    private readonly advanced: SceneAdvancedTools;
    private readonly actions: ToolActionMap;

    constructor(
        sceneAdapter: SceneAdapter = selectCocosAdapter().scene,
        advancedAdapter: SceneAdvancedAdapter = selectCocosAdapter().sceneAdvanced
    ) {
        this.scene = new SceneTools(sceneAdapter);
        this.advanced = new SceneAdvancedTools(advancedAdapter);
        this.actions = {
            management: {
                current: { executor: this.scene, method: 'get_current_scene' },
                list: { executor: this.scene, method: 'get_scene_list' },
                open: { executor: this.scene, method: 'open_scene' },
                save: { executor: this.scene, method: 'save_scene' },
                create: { executor: this.scene, method: 'create_scene' },
                close: { executor: this.scene, method: 'close_scene' }
            },
            hierarchy: {
                get: { executor: this.scene, method: 'get_scene_hierarchy' }
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
    }

    getTools(): ToolDefinition[] {
        return [
            { name: 'management', description: 'Scene management', inputSchema: buildActionSchema(this.actions.management, 'Scene management parameters') },
            { name: 'hierarchy', description: 'Scene hierarchy access', inputSchema: buildActionSchema(this.actions.hierarchy, 'Scene hierarchy parameters') },
            { name: 'snapshot', description: 'Scene snapshot operations', inputSchema: buildActionSchema(this.actions.snapshot, 'Scene snapshot parameters') },
            { name: 'query', description: 'Query scene status and metadata', inputSchema: buildActionSchema(this.actions.query, 'Scene query parameters') },
            { name: 'undo', description: 'Undo recording control', inputSchema: buildActionSchema(this.actions.undo, 'Undo parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
