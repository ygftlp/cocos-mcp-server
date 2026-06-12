// v1.5 core component tools: action-based facade.
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ComponentTools } from './component-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ComponentCoreTools implements ToolExecutor {
    private component = new ComponentTools();
    private advanced = new SceneAdvancedTools();

    private actions: ToolActionMap = {
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

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'manage',
                description: 'Manage components (add/remove/list available)',
                inputSchema: buildActionSchema(Object.keys(this.actions.manage), 'Parameters for the selected action')
            },
            {
                name: 'script',
                description: 'Script component operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.script), 'Parameters for the selected action')
            },
            {
                name: 'query',
                description: 'Query components on node',
                inputSchema: buildActionSchema(Object.keys(this.actions.query), 'Parameters for the selected action')
            },
            {
                name: 'property',
                description: 'Component property operations',
                inputSchema: buildActionSchema(Object.keys(this.actions.property), 'Parameters for the selected action')
            },
            {
                name: 'event',
                description: 'Execute component methods',
                inputSchema: buildActionSchema(Object.keys(this.actions.event), 'Parameters for the selected action')
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
