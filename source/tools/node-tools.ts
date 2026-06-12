import { ToolDefinition, ToolResponse, ToolExecutor, NodeInfo } from '../types';
// Slim MCP node tool adapter: direct Editor API calls only (no post-processing).
export class NodeTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'create_node':
                return await this.createNode(args);
            case 'get_node_info':
                return await this.getNodeInfo(args?.uuid);
            case 'find_nodes':
                return await this.findNodes(args?.pattern, args?.exactMatch);
            case 'find_node_by_name':
                return await this.findNodeByName(args?.name);
            case 'get_all_nodes':
                return await this.getAllNodes();
            case 'set_node_property':
                return await this.setNodeProperty(args?.uuid, args?.property, args?.value);
            case 'set_node_transform':
                return await this.setNodeTransform(args);
            case 'delete_node':
                return await this.deleteNode(args?.uuid);
            case 'move_node':
                return await this.moveNode(args?.nodeUuid, args?.newParentUuid, args?.siblingIndex);
            case 'duplicate_node':
                return await this.duplicateNode(args?.uuid, args?.includeChildren);
            case 'detect_node_type':
                return await this.detectNodeType(args?.uuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    // Create node via `create-node` with minimal option handling.

    private async createNode(args: any): Promise<ToolResponse> {
        try {
            const name = args?.name || 'Node';
            let finalAssetUuid = args?.assetUuid;

            if (!finalAssetUuid && args?.assetPath) {
                const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', args.assetPath);
                if (!assetInfo?.uuid) {
                    return { success: false, error: `Asset not found: ${args.assetPath}` };
                }
                finalAssetUuid = assetInfo.uuid;
            }

            const createNodeOptions: any = { name };
            if (args?.parentUuid) {
                createNodeOptions.parent = args.parentUuid;
            }
            if (finalAssetUuid) {
                createNodeOptions.assetUuid = finalAssetUuid;
                if (args?.unlinkPrefab) {
                    createNodeOptions.unlinkPrefab = true;
                }
            }
            if (Array.isArray(args?.components) && args.components.length > 0) {
                createNodeOptions.components = args.components;
            } else if (args?.nodeType && args.nodeType !== 'Node' && !finalAssetUuid) {
                createNodeOptions.components = [args.nodeType];
            }
            if (args?.keepWorldTransform) {
                createNodeOptions.keepWorldTransform = true;
            }

            const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
            const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;

            return {
                success: true,
                data: {
                    uuid,
                    name,
                    parentUuid: args?.parentUuid || null,
                    assetUuid: finalAssetUuid || null
                }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getNodeInfo(uuid: string): Promise<ToolResponse> {
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        try {
            const nodeData = await Editor.Message.request('scene', 'query-node', uuid);
            if (!nodeData) {
                return { success: false, error: 'Node not found or invalid response' };
            }

            const info: NodeInfo = {
                uuid: nodeData.uuid?.value || uuid,
                name: nodeData.name?.value || nodeData.name || 'Unknown',
                active: nodeData.active?.value !== undefined ? nodeData.active.value : (nodeData.active ?? true),
                position: nodeData.position?.value || nodeData.position || { x: 0, y: 0, z: 0 },
                rotation: nodeData.rotation?.value || nodeData.rotation || { x: 0, y: 0, z: 0 },
                scale: nodeData.scale?.value || nodeData.scale || { x: 1, y: 1, z: 1 },
                parent: nodeData.parent?.value?.uuid || null,
                children: nodeData.children || [],
                components: (nodeData.__comps__ || []).map((comp: any) => ({
                    type: comp.__type__ || comp.cid || comp.type || 'Unknown',
                    enabled: comp.enabled !== undefined ? comp.enabled : true
                })),
                layer: nodeData.layer?.value || nodeData.layer || 1073741824,
                mobility: nodeData.mobility?.value || nodeData.mobility || 0
            };

            return { success: true, data: info };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    // Tree traversal based name search (no script fallback).

    private async findNodes(pattern: string, exactMatch: boolean = false): Promise<ToolResponse> {
        if (!pattern) {
            return { success: false, error: 'Missing pattern' };
        }
        try {
            const tree = await Editor.Message.request('scene', 'query-node-tree');
            const nodes: any[] = [];

            const searchTree = (node: any, currentPath: string) => {
                if (!node) return;
                const nodeName = typeof node.name === 'string' ? node.name : '';
                const nodePath = currentPath ? `${currentPath}/${nodeName}` : nodeName;
                const matches = exactMatch ? nodeName === pattern : nodeName.toLowerCase().includes(String(pattern).toLowerCase());
                if (matches) {
                    nodes.push({ uuid: node.uuid, name: node.name, path: nodePath });
                }
                if (node.children) {
                    for (const child of node.children) {
                        searchTree(child, nodePath);
                    }
                }
            };

            if (tree) {
                searchTree(tree, '');
            }

            return { success: true, data: nodes };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async findNodeByName(name: string): Promise<ToolResponse> {
        if (!name) {
            return { success: false, error: 'Missing name' };
        }
        const results = await this.findNodes(name, true);
        if (!results.success || !Array.isArray(results.data) || results.data.length === 0) {
            return { success: false, error: `Node '${name}' not found` };
        }
        return { success: true, data: results.data[0] };
    }

    private async getAllNodes(): Promise<ToolResponse> {
        try {
            const tree = await Editor.Message.request('scene', 'query-node-tree');
            const nodes: any[] = [];

            const traverseTree = (node: any, currentPath: string) => {
                if (!node) return;
                const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
                nodes.push({
                    uuid: node.uuid,
                    name: node.name,
                    type: node.type,
                    active: node.active,
                    path: nodePath
                });
                if (node.children) {
                    for (const child of node.children) {
                        traverseTree(child, nodePath);
                    }
                }
            };

            if (tree) {
                traverseTree(tree, '');
            }

            return { success: true, data: { totalNodes: nodes.length, nodes } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async setNodeProperty(uuid: string, property: string, value: any): Promise<ToolResponse> {
        if (!uuid || !property) {
            return { success: false, error: 'Missing uuid or property' };
        }
        try {
            await Editor.Message.request('scene', 'set-property', {
                uuid,
                path: property,
                dump: { value }
            });
            return {
                success: true,
                data: { nodeUuid: uuid, property, newValue: value }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    // Direct transform property writes without normalization.

    private async setNodeTransform(args: any): Promise<ToolResponse> {
        const uuid = args?.uuid;
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        try {
            const updates: string[] = [];
            if (args?.position) {
                await Editor.Message.request('scene', 'set-property', {
                    uuid,
                    path: 'position',
                    dump: { value: args.position }
                });
                updates.push('position');
            }
            if (args?.rotation) {
                await Editor.Message.request('scene', 'set-property', {
                    uuid,
                    path: 'rotation',
                    dump: { value: args.rotation }
                });
                updates.push('rotation');
            }
            if (args?.scale) {
                await Editor.Message.request('scene', 'set-property', {
                    uuid,
                    path: 'scale',
                    dump: { value: args.scale }
                });
                updates.push('scale');
            }

            if (updates.length === 0) {
                return { success: false, error: 'No transform properties specified' };
            }

            return {
                success: true,
                data: { nodeUuid: uuid, updatedProperties: updates }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async deleteNode(uuid: string): Promise<ToolResponse> {
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        try {
            await Editor.Message.request('scene', 'remove-node', { uuid });
            return { success: true, message: 'Node deleted successfully' };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async moveNode(nodeUuid: string, newParentUuid: string, _siblingIndex: number = -1): Promise<ToolResponse> {
        if (!nodeUuid || !newParentUuid) {
            return { success: false, error: 'Missing nodeUuid or newParentUuid' };
        }
        try {
            await Editor.Message.request('scene', 'set-parent', {
                parent: newParentUuid,
                uuids: [nodeUuid],
                keepWorldTransform: false
            });
            return { success: true, message: 'Node moved successfully' };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async duplicateNode(uuid: string, _includeChildren: boolean = true): Promise<ToolResponse> {
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        try {
            const result = await Editor.Message.request('scene', 'duplicate-node', uuid);
            return {
                success: true,
                data: {
                    newUuid: result?.uuid || result,
                    message: 'Node duplicated successfully'
                }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async detectNodeType(uuid: string): Promise<ToolResponse> {
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        const info = await this.getNodeInfo(uuid);
        if (!info.success || !info.data) {
            return { success: false, error: 'Failed to get node information' };
        }
        const components = info.data.components || [];
        const has2D = components.some((comp: any) =>
            typeof comp.type === 'string' && (
                comp.type.includes('cc.Sprite') ||
                comp.type.includes('cc.Label') ||
                comp.type.includes('cc.Button') ||
                comp.type.includes('cc.Layout') ||
                comp.type.includes('cc.Widget')
            )
        );
        const has3D = components.some((comp: any) =>
            typeof comp.type === 'string' && (
                comp.type.includes('cc.MeshRenderer') ||
                comp.type.includes('cc.Camera') ||
                comp.type.includes('cc.Light')
            )
        );
        const nodeType = has2D ? '2D' : (has3D ? '3D' : 'unknown');
        return { success: true, data: { nodeUuid: uuid, nodeType } };
    }
}
