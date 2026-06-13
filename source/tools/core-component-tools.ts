import { ComponentAdapter } from '../adapters/contracts/component-adapter';
import { SceneAdvancedAdapter } from '../adapters/contracts/scene-advanced-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ComponentReflectionTools } from './component-reflection-tools';
import { ComponentTools } from './component-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class ComponentCoreTools implements ToolExecutor {
    private readonly component: ComponentTools;
    private readonly advanced: SceneAdvancedTools;
    private readonly reflection: ComponentReflectionTools;
    private readonly actions: ToolActionMap;

    constructor(
        componentAdapter: ComponentAdapter = selectCocosAdapter().component,
        advancedAdapter: SceneAdvancedAdapter = selectCocosAdapter().sceneAdvanced
    ) {
        this.component = new ComponentTools(componentAdapter);
        this.advanced = new SceneAdvancedTools(advancedAdapter);
        this.reflection = new ComponentReflectionTools(componentAdapter, advancedAdapter);
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
            reflection: {
                list_classes: { executor: this.reflection, method: 'list_component_classes' },
                schema: { executor: this.reflection, method: 'get_component_schema' },
                validate: { executor: this.reflection, method: 'validate_component_properties' }
            },
            property: {
                set: { executor: this.component, method: 'set_component_property' },
                set_many: { executor: this.reflection, method: 'set_component_properties' },
                validate: { executor: this.reflection, method: 'validate_component_properties' },
                reset: { executor: this.advanced, method: 'reset_component' }
            }
        };
    }

    getTools(): ToolDefinition[] {
        return [
            { name: 'manage', description: 'Manage components', inputSchema: buildActionSchema(this.actions.manage, 'Component management parameters') },
            { name: 'script', description: 'Script component operations', inputSchema: buildActionSchema(this.actions.script, 'Script component parameters') },
            { name: 'query', description: 'Query components on a node', inputSchema: buildActionSchema(this.actions.query, 'Component query parameters') },
            {
                name: 'reflection',
                title: 'Reflect Cocos component classes and serialized properties',
                description: 'List engine and project component classes, derive a live serialized property schema, and validate arbitrary property paths against the current project.',
                inputSchema: buildActionSchema(this.actions.reflection, 'Component reflection parameters'),
                xCocos: {
                    kind: 'read', destructive: false, sideEffect: false, cost: 'medium', scope: ['scene'],
                    requires: ['component.read', 'scene.read']
                }
            },
            { name: 'property', description: 'Validate, set, batch-update, or reset component properties', inputSchema: buildActionSchema(this.actions.property, 'Component property parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
