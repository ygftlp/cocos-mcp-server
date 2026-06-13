import { ToolDefinition, ToolResponse, ToolExecutor, NodeInfo } from '../types';

// Model-facing node adapter. Every Editor response is normalized into plain JSON.
export class NodeTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'create_node': return this.createNode(args || {});
            case 'get_node_info': return this.getNodeInfo(args?.uuid);
            case 'find_nodes': return this.findNodes(args?.pattern, args?.exactMatch);
            case 'find_node_by_name': return this.findNodeByName(args?.name);
            case 'get_all_nodes': return this.getAllNodes();
            case 'set_node_property': return this.setNodeProperty(args?.uuid, args?.property, args?.value);
            case 'set_node_transform': return this.setNodeTransform(args || {});
            case 'delete_node': return this.deleteNode(args?.uuid);
            case 'move_node': return this.moveNode(args?.nodeUuid, args?.newParentUuid, args?.siblingIndex);
            case 'duplicate_node': return this.duplicateNode(args?.uuid, args?.includeChildren);
            case 'detect_node_type': return this.detectNodeType(args?.uuid);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private request(channel: string, message: string, ...args: any[]): Promise<any> {
        return (Editor.Message.request as any)(channel, message, ...args);
    }

    private unwrap<T = any>(value: any, fallback?: T): T {
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'value')) {
            return this.unwrap(value.value, fallback);
        }
        return (value === undefined || value === null ? fallback : value) as T;
    }

    private uuidOf(value: any): string | null {
        const unwrapped = this.unwrap<any>(value, null);
        if (typeof unwrapped === 'string') return unwrapped;
        if (Array.isArray(unwrapped)) return this.uuidOf(unwrapped[0]);
        if (unwrapped && typeof unwrapped === 'object') {
            return this.uuidOf(unwrapped.uuid ?? unwrapped.id ?? null);
        }
        return null;
    }

    private vector(value: any, fallback: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
        const raw = this.unwrap<any>(value, fallback) || fallback;
        return {
            x: Number.isFinite(Number(raw.x)) ? Number(raw.x) : fallback.x,
            y: Number.isFinite(Number(raw.y)) ? Number(raw.y) : fallback.y,
            z: Number.isFinite(Number(raw.z)) ? Number(raw.z) : fallback.z
        };
    }

    private async createNode(args: any): Promise<ToolResponse> {
        try {
            const name = typeof args.name === 'string' && args.name.trim() ? args.name.trim() : 'Node';
            let assetUuid = typeof args.assetUuid === 'string' ? args.assetUuid : undefined;
            if (!assetUuid && args.assetPath) {
                const assetInfo: any = await this.request('asset-db', 'query-asset-info', args.assetPath);
                assetUuid = this.uuidOf(assetInfo?.uuid) || undefined;
                if (!assetUuid) return { success: false, error: `Asset not found: ${args.assetPath}` };
            }

            const options: Record<string, any> = { name };
            if (args.parentUuid) options.parent = args.parentUuid;
            if (assetUuid) {
                options.assetUuid = assetUuid;
                if (args.unlinkPrefab) options.unlinkPrefab = true;
            }
            if (Array.isArray(args.components) && args.components.length) options.components = args.components;
            else if (args.nodeType && args.nodeType !== 'Node' && !assetUuid) options.components = [args.nodeType];
            if (args.keepWorldTransform) options.keepWorldTransform = true;

            const response = await this.request('scene', 'create-node', options);
            const uuid = this.uuidOf(response);
            if (!uuid) return { success: false, error: 'Cocos did not return a node UUID' };
            return { success: true, data: { uuid, name, parentUuid: args.parentUuid || null, assetUuid: assetUuid || null } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getNodeInfo(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            const raw: any = await this.request('scene', 'query-node', uuid);
            if (!raw) return { success: false, error: 'Node not found or invalid response' };
            const children = this.unwrap<any[]>(raw.children, []) || [];
            const components = (raw.__comps__ || []).map((component: any) => ({
                type: String(component.__type__ || component.cid || component.type || 'Unknown'),
                enabled: Boolean(this.unwrap(component.enabled, true))
            }));
            const info: NodeInfo = {
                uuid: this.uuidOf(raw.uuid) || uuid,
                name: String(this.unwrap(raw.name, 'Unknown')),
                active: Boolean(this.unwrap(raw.active, true)),
                position: this.vector(raw.position, { x: 0, y: 0, z: 0 }),
                rotation: this.vector(raw.rotation, { x: 0, y: 0, z: 0 }),
                scale: this.vector(raw.scale, { x: 1, y: 1, z: 1 }),
                parent: this.uuidOf(raw.parent) || undefined,
                children: children.map((child) => this.uuidOf(child)).filter((value): value is string => Boolean(value)),
                components,
                layer: Number(this.unwrap(raw.layer, 1073741824)),
                mobility: Number(this.unwrap(raw.mobility, 0))
            };
            return { success: true, data: info };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async findNodes(pattern: string, exactMatch = false): Promise<ToolResponse> {
        if (!pattern) return { success: false, error: 'Missing pattern' };
        try {
            const tree: any = await this.request('scene', 'query-node-tree');
            const nodes: any[] = [];
            const visit = (node: any, parentPath: string) => {
                if (!node) return;
                const name = String(node.name || '');
                const currentPath = parentPath ? `${parentPath}/${name}` : name;
                const match = exactMatch ? name === pattern : name.toLowerCase().includes(String(pattern).toLowerCase());
                if (match) nodes.push({ uuid: node.uuid, name, path: currentPath });
                for (const child of node.children || []) visit(child, currentPath);
            };
            visit(tree, '');
            return { success: true, data: nodes };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async findNodeByName(name: string): Promise<ToolResponse> {
        if (!name) return { success: false, error: 'Missing name' };
        const result = await this.findNodes(name, true);
        if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
            return { success: false, error: `Node '${name}' not found` };
        }
        return { success: true, data: result.data[0] };
    }

    private async getAllNodes(): Promise<ToolResponse> {
        try {
            const tree: any = await this.request('scene', 'query-node-tree');
            const nodes: any[] = [];
            const visit = (node: any, parentPath: string) => {
                if (!node) return;
                const name = String(node.name || 'Node');
                const currentPath = parentPath ? `${parentPath}/${name}` : name;
                nodes.push({ uuid: node.uuid, name, type: node.type, active: node.active, path: currentPath });
                for (const child of node.children || []) visit(child, currentPath);
            };
            visit(tree, '');
            return { success: true, data: { totalNodes: nodes.length, nodes } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async setNodeProperty(uuid: string, property: string, value: any): Promise<ToolResponse> {
        if (!uuid || !property) return { success: false, error: 'Missing uuid or property' };
        try {
            await this.request('scene', 'set-property', { uuid, path: property, dump: { value } });
            return { success: true, data: { nodeUuid: uuid, property, newValue: value } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async setNodeTransform(args: any): Promise<ToolResponse> {
        if (!args.uuid) return { success: false, error: 'Missing uuid' };
        try {
            const updates: string[] = [];
            for (const property of ['position', 'rotation', 'scale']) {
                if (args[property] === undefined) continue;
                await this.request('scene', 'set-property', { uuid: args.uuid, path: property, dump: { value: args[property] } });
                updates.push(property);
            }
            if (!updates.length) return { success: false, error: 'No transform properties specified' };
            return { success: true, data: { nodeUuid: args.uuid, updatedProperties: updates } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async deleteNode(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            await this.request('scene', 'remove-node', { uuid });
            return { success: true, message: 'Node deleted successfully' };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async moveNode(nodeUuid: string, newParentUuid: string, siblingIndex = -1): Promise<ToolResponse> {
        if (!nodeUuid || !newParentUuid) return { success: false, error: 'Missing nodeUuid or newParentUuid' };
        try {
            await this.request('scene', 'set-parent', {
                parent: newParentUuid,
                uuids: [nodeUuid],
                keepWorldTransform: false,
                ...(Number.isInteger(siblingIndex) && siblingIndex >= 0 ? { index: siblingIndex } : {})
            });
            return { success: true, data: { nodeUuid, newParentUuid, siblingIndex } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async duplicateNode(uuid: string, includeChildren = true): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            const response: any = await this.request('scene', 'duplicate-node', uuid);
            const newUuid = this.uuidOf(response);
            if (!newUuid) return { success: false, error: 'Cocos did not return the duplicated node UUID' };
            return { success: true, data: { newUuid, includeChildren, message: 'Node duplicated successfully' } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async detectNodeType(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        const result = await this.getNodeInfo(uuid);
        if (!result.success || !result.data) return { success: false, error: result.error || 'Failed to get node information' };
        const components = result.data.components || [];
        const has2D = components.some((component: any) => ['Sprite', 'Label', 'Button', 'Layout', 'Widget', 'UITransform'].some((name) => String(component.type).includes(name)));
        const has3D = components.some((component: any) => ['MeshRenderer', 'Camera', 'Light'].some((name) => String(component.type).includes(name)));
        return { success: true, data: { nodeUuid: uuid, nodeType: has2D ? '2D' : (has3D ? '3D' : 'unknown') } };
    }
}
