// v1.5 core prefab tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { PrefabTools } from './prefab-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class PrefabCoreTools implements ToolExecutor {
    private prefab = new PrefabTools();
    private advanced = new SceneAdvancedTools();

    private actions: ToolActionMap = {
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

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'browse',
                description: 'Browse and inspect prefabs',
                inputSchema: buildActionSchema(Object.keys(this.actions.browse), 'Parameters for the selected action')
            },
            {
                name: 'lifecycle',
                description: 'Prefab create/update/duplicate',
                inputSchema: buildActionSchema(Object.keys(this.actions.lifecycle), 'Parameters for the selected action')
            },
            {
                name: 'instance',
                description: 'Prefab instantiation and revert',
                inputSchema: buildActionSchema(Object.keys(this.actions.instance), 'Parameters for the selected action')
            },
            {
                name: 'edit',
                description: 'Prefab edit operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.edit), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
