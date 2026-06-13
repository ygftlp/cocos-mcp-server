import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { PrefabTools } from './prefab-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class PrefabCoreTools implements ToolExecutor {
    private readonly prefab: PrefabTools;
    private readonly advanced = new SceneAdvancedTools();
    private readonly actions: ToolActionMap;

    constructor(adapter: CocosAdapter = selectCocosAdapter()) {
        this.prefab = new PrefabTools(adapter);
        this.actions = {
            browse: {
                list: { executor: this.prefab, method: 'get_prefab_list' },
                info: { executor: this.prefab, method: 'get_prefab_info' },
                validate: { executor: this.prefab, method: 'validate_prefab' },
                load: { executor: this.prefab, method: 'load_prefab' }
            },
            lifecycle: {
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

    getTools(): ToolDefinition[] {
        return [
            { name: 'browse', description: 'Browse and inspect prefabs', inputSchema: buildActionSchema(this.actions.browse, 'Prefab browse parameters') },
            { name: 'lifecycle', description: 'Update or duplicate existing prefabs', inputSchema: buildActionSchema(this.actions.lifecycle, 'Prefab lifecycle parameters') },
            { name: 'instance', description: 'Prefab instantiation and revert', inputSchema: buildActionSchema(this.actions.instance, 'Prefab instance parameters') },
            { name: 'edit', description: 'Prefab edit operations', inputSchema: buildActionSchema(this.actions.edit, 'Prefab edit parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
