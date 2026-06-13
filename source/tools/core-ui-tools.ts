import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { UITools } from './ui-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

const referenceSchema = {
    oneOf: [
        { type: 'object', properties: { $node: { type: 'string' } }, required: ['$node'], additionalProperties: false },
        { type: 'object', properties: { $asset: { type: 'string' } }, required: ['$asset'], additionalProperties: false },
        {
            type: 'object',
            properties: {
                $component: {
                    type: 'object',
                    properties: {
                        nodeUuid: { type: 'string' },
                        node: { type: 'string' },
                        type: { type: 'string' }
                    },
                    required: ['type'],
                    additionalProperties: false
                }
            },
            required: ['$component'],
            additionalProperties: false
        }
    ]
};

export class UICoreTools implements ToolExecutor {
    private readonly ui = new UITools();

    private readonly queryActions: ToolActionMap = {
        scene: { executor: this.ui, method: 'query_scene' },
        inspect: { executor: this.ui, method: 'inspect' },
        component_schema: { executor: this.ui, method: 'component_schema' }
    };

    private readonly elementActions: ToolActionMap = {
        create: { executor: this.ui, method: 'create' },
        add_component: { executor: this.ui, method: 'add_component' },
        set_properties: { executor: this.ui, method: 'set_properties' },
        remove_component: { executor: this.ui, method: 'remove_component' },
        duplicate: { executor: this.ui, method: 'duplicate' },
        delete: { executor: this.ui, method: 'delete' }
    };

    private readonly eventActions: ToolActionMap = {
        configure: { executor: this.ui, method: 'configure_event' },
        list: { executor: this.ui, method: 'list_events' }
    };

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'catalog',
                title: 'Cocos UI component catalog',
                description: 'List every Cocos Creator 3.8 UI and 2D-renderable component addressable through MCP, including dependencies and event properties.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        category: { type: 'string', enum: ['root', 'transform', 'render', 'layout', 'interactive', 'navigation', 'media', 'utility', 'optional'] }
                    },
                    additionalProperties: false
                },
                xCocos: { kind: 'read', destructive: false, sideEffect: false, cost: 'low', scope: ['scene'] }
            },
            {
                name: 'query',
                title: 'Query Cocos UI elements',
                description: 'Discover UI elements in the active scene, inspect all serialized properties, or derive a property schema from an existing component.',
                inputSchema: buildActionSchema(this.queryActions, 'UI query parameters'),
                xCocos: { kind: 'read', destructive: false, sideEffect: false, cost: 'medium', scope: ['scene'] }
            },
            {
                name: 'element',
                title: 'Create and edit any Cocos UI element',
                description: 'Create, duplicate, delete, add/remove components, and set arbitrary serialized properties for built-in or custom UI components.',
                inputSchema: {
                    oneOf: [
                        {
                            type: 'object',
                            title: 'create',
                            properties: {
                                action: { type: 'string', enum: ['create'] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        parentUuid: { type: 'string' },
                                        elementType: { type: 'string', description: 'Catalog id, alias, Cocos class name, or project-defined component class' },
                                        position: { type: 'object' },
                                        rotation: { type: 'object' },
                                        scale: { type: 'object' },
                                        properties: { type: 'object', additionalProperties: true },
                                        componentProperties: { type: 'object', additionalProperties: { type: 'object', additionalProperties: true } },
                                        nodeProperties: { type: 'object', additionalProperties: true },
                                        autoDependencies: { type: 'boolean', default: true },
                                        keepWorldTransform: { type: 'boolean', default: false },
                                        rollbackOnError: { type: 'boolean', default: true }
                                    },
                                    required: ['elementType'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        },
                        {
                            type: 'object',
                            title: 'add_component',
                            properties: {
                                action: { type: 'string', enum: ['add_component'] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        nodeUuid: { type: 'string' },
                                        componentType: { type: 'string' },
                                        properties: { type: 'object', additionalProperties: true },
                                        autoDependencies: { type: 'boolean', default: true }
                                    },
                                    required: ['nodeUuid', 'componentType'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        },
                        {
                            type: 'object',
                            title: 'set_properties',
                            properties: {
                                action: { type: 'string', enum: ['set_properties'] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        nodeUuid: { type: 'string' },
                                        componentType: { type: 'string' },
                                        properties: {
                                            type: 'object',
                                            description: 'Arbitrary serialized component properties. Values may contain $node, $component, or $asset references.',
                                            additionalProperties: true
                                        },
                                        referenceSyntax: referenceSchema
                                    },
                                    required: ['nodeUuid', 'componentType', 'properties'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        },
                        ...['remove_component', 'duplicate', 'delete'].map((action) => ({
                            type: 'object',
                            title: action,
                            properties: {
                                action: { type: 'string', enum: [action] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        nodeUuid: { type: 'string' },
                                        componentType: { type: 'string' },
                                        includeChildren: { type: 'boolean', default: true }
                                    },
                                    required: action === 'remove_component' ? ['nodeUuid', 'componentType'] : ['nodeUuid'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        }))
                    ]
                },
                xCocos: { kind: 'write', destructive: true, sideEffect: true, cost: 'medium', scope: ['scene'] }
            },
            {
                name: 'event',
                title: 'Configure Cocos UI events',
                description: 'List, add, replace, or clear serialized Cocos Component.EventHandler entries for Button, Toggle, Slider, ScrollView, EditBox, PageView, WebView, VideoPlayer, and custom UI components.',
                inputSchema: {
                    oneOf: [
                        {
                            type: 'object',
                            title: 'configure',
                            properties: {
                                action: { type: 'string', enum: ['configure'] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        nodeUuid: { type: 'string' },
                                        componentType: { type: 'string' },
                                        eventProperty: { type: 'string' },
                                        mode: { type: 'string', enum: ['add', 'replace', 'clear'], default: 'add' },
                                        handlers: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    targetNodeUuid: { type: 'string' },
                                                    component: { type: 'string' },
                                                    handler: { type: 'string' },
                                                    customEventData: { type: 'string' }
                                                },
                                                required: ['targetNodeUuid', 'component', 'handler'],
                                                additionalProperties: false
                                            }
                                        }
                                    },
                                    required: ['nodeUuid', 'componentType', 'eventProperty'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        },
                        {
                            type: 'object',
                            title: 'list',
                            properties: {
                                action: { type: 'string', enum: ['list'] },
                                params: {
                                    type: 'object',
                                    properties: {
                                        nodeUuid: { type: 'string' },
                                        componentType: { type: 'string' },
                                        eventProperty: { type: 'string' }
                                    },
                                    required: ['nodeUuid', 'componentType'],
                                    additionalProperties: false
                                }
                            },
                            required: ['action', 'params'],
                            additionalProperties: false
                        }
                    ]
                },
                xCocos: { kind: 'write', destructive: false, sideEffect: true, cost: 'medium', scope: ['scene'] }
            },
            {
                name: 'validate',
                title: 'Validate Cocos UI scene coverage',
                description: 'Scan the active scene and verify catalog component dependencies for every discovered UI element.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        rootUuid: { type: 'string' },
                        maxNodes: { type: 'integer', minimum: 1, maximum: 1000, default: 500 }
                    },
                    additionalProperties: false
                },
                xCocos: { kind: 'read', destructive: false, sideEffect: false, cost: 'high', scope: ['scene'] }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        if (toolName === 'catalog') return this.ui.execute('catalog', args);
        if (toolName === 'query') return executeAction(toolName, args, { query: this.queryActions });
        if (toolName === 'element') return executeAction(toolName, args, { element: this.elementActions });
        if (toolName === 'event') return executeAction(toolName, args, { event: this.eventActions });
        if (toolName === 'validate') return this.ui.execute('validate_scene', args);
        throw new Error(`Unknown UI core tool: ${toolName}`);
    }
}
