import { NodeAdapter } from '../adapters/contracts/node-adapter';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { NodeTools } from './node-tools';
import { SceneAdvancedTools } from './scene-advanced-tools';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';

export class NodeCoreTools implements ToolExecutor {
    private readonly node: NodeTools;
    private readonly advanced = new SceneAdvancedTools();
    private readonly actions: ToolActionMap;

    constructor(nodeAdapter: NodeAdapter) {
        this.node = new NodeTools(nodeAdapter);
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

    getTools(): ToolDefinition[] {
        return [
            { name: 'query', description: 'Node query and lookup', inputSchema: buildActionSchema(this.actions.query, 'Node query parameters') },
            { name: 'lifecycle', description: 'Node lifecycle operations', inputSchema: buildActionSchema(this.actions.lifecycle, 'Node lifecycle parameters') },
            { name: 'transform', description: 'Node transform and property changes', inputSchema: buildActionSchema(this.actions.transform, 'Node transform parameters') },
            { name: 'hierarchy', description: 'Node hierarchy operations', inputSchema: buildActionSchema(this.actions.hierarchy, 'Node hierarchy parameters') },
            { name: 'clipboard', description: 'Node clipboard operations', inputSchema: buildActionSchema(this.actions.clipboard, 'Node clipboard parameters') },
            { name: 'property_management', description: 'Reset and manage node properties', inputSchema: buildActionSchema(this.actions.property_management, 'Node property parameters') },
            { name: 'batch', description: 'Batch array operations for nodes', inputSchema: buildActionSchema(this.actions.batch, 'Node batch parameters') }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }

    clearCache(): void {
        const candidate = this.node as any;
        if (typeof candidate.clearCache === 'function') candidate.clearCache();
    }
}
