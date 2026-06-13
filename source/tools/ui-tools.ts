import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ComponentTools } from './component-tools';
import { NodeTools } from './node-tools';
import {
    findUIComponent,
    isCatalogUIComponent,
    normalizeUIComponentClass,
    UI_COMPONENT_CATALOG,
    UIComponentDescriptor
} from './ui-component-catalog';

export class UITools implements ToolExecutor {
    private readonly nodes = new NodeTools();
    private readonly components = new ComponentTools();

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'catalog': return this.catalog(args || {});
            case 'query_scene': return this.queryScene(args || {});
            case 'inspect': return this.inspect(args || {});
            case 'component_schema': return this.componentSchema(args || {});
            case 'create': return this.createElement(args || {});
            case 'add_component': return this.addComponent(args || {});
            case 'set_properties': return this.setProperties(args || {});
            case 'remove_component': return this.removeComponent(args || {});
            case 'delete': return this.nodes.execute('delete_node', { uuid: args?.nodeUuid });
            case 'duplicate': return this.nodes.execute('duplicate_node', { uuid: args?.nodeUuid, includeChildren: args?.includeChildren !== false });
            case 'configure_event': return this.configureEvent(args || {});
            case 'list_events': return this.listEvents(args || {});
            case 'validate_scene': return this.validateScene(args || {});
            default: throw new Error(`Unknown UI tool: ${toolName}`);
        }
    }

    private async catalog(args: any): Promise<ToolResponse> {
        const category = typeof args.category === 'string' ? args.category : undefined;
        const components = UI_COMPONENT_CATALOG
            .filter((item) => !category || item.category === category)
            .map((item) => ({ ...item }));
        return {
            success: true,
            data: {
                cocosRange: '>=3.8.6 <3.9.0',
                count: components.length,
                categories: Array.from(new Set(UI_COMPONENT_CATALOG.map((item) => item.category))),
                components,
                customComponentsSupported: true
            }
        };
    }

    private async inspect(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        const dump = await this.queryNode(nodeUuid);
        if (!dump) return { success: false, error: `Node not found: ${nodeUuid}` };
        return {
            success: true,
            data: this.describeNode(dump, args.includeProperties !== false, args.includeCustom !== false)
        };
    }

    private async componentSchema(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        const dump = await this.queryNode(nodeUuid);
        const match = this.findComponent(dump, componentType);
        if (!match) return { success: false, error: `Component ${componentType} not found on node` };
        const properties: Record<string, any> = {};
        for (const [key, value] of Object.entries(match.component || {})) {
            if (this.isInternalKey(key)) continue;
            properties[key] = this.describeProperty(value);
        }
        return {
            success: true,
            data: {
                nodeUuid,
                componentType: match.type,
                componentIndex: match.index,
                properties
            }
        };
    }

    private async queryScene(args: any): Promise<ToolResponse> {
        const maxNodes = Math.max(1, Math.min(1000, Number(args.maxNodes) || 300));
        const includeProperties = Boolean(args.includeProperties);
        const includeCustom = args.includeCustom !== false;
        const tree = await Editor.Message.request('scene', 'query-node-tree');
        const flat: any[] = [];
        const walk = (node: any, path: string) => {
            if (!node || flat.length >= maxNodes) return;
            const currentPath = path ? `${path}/${node.name || 'Node'}` : (node.name || 'Node');
            flat.push({ uuid: node.uuid, path: currentPath });
            for (const child of node.children || []) walk(child, currentPath);
        };
        walk(args.rootUuid ? this.findTreeNode(tree, String(args.rootUuid)) : tree, '');

        const results: any[] = [];
        for (let index = 0; index < flat.length; index += 12) {
            const batch = flat.slice(index, index + 12);
            const dumps = await Promise.all(batch.map((item) => this.queryNode(item.uuid).catch(() => null)));
            dumps.forEach((dump, offset) => {
                if (!dump) return;
                const described = this.describeNode(dump, includeProperties, includeCustom);
                if (described.uiComponents.length > 0) results.push({ ...described, path: batch[offset].path });
            });
        }

        return {
            success: true,
            data: {
                scannedNodes: flat.length,
                uiNodeCount: results.length,
                truncated: flat.length >= maxNodes,
                nodes: results
            }
        };
    }

    private async createElement(args: any): Promise<ToolResponse> {
        const componentType = normalizeUIComponentClass(args.elementType || args.componentType || 'cc.UITransform');
        const descriptor = findUIComponent(componentType);
        const created = await this.nodes.execute('create_node', {
            name: args.name || descriptor?.displayName || componentType.replace(/^cc\./, ''),
            parentUuid: args.parentUuid,
            keepWorldTransform: Boolean(args.keepWorldTransform)
        });
        if (!created.success || !created.data?.uuid) return created;

        const nodeUuid = created.data.uuid;
        try {
            if (args.position || args.rotation || args.scale) {
                const transform = await this.nodes.execute('set_node_transform', {
                    uuid: nodeUuid,
                    position: args.position,
                    rotation: args.rotation,
                    scale: args.scale
                });
                if (!transform.success) throw new Error(transform.error || 'Failed to set transform');
            }

            const required = args.autoDependencies === false
                ? [componentType]
                : [...(descriptor?.dependencies || ['cc.UITransform']), componentType];
            for (const type of Array.from(new Set(required))) {
                const result = await this.ensureComponent(nodeUuid, type);
                if (!result.success) throw new Error(result.error || `Failed to add ${type}`);
            }

            const propertyGroups = args.componentProperties && typeof args.componentProperties === 'object'
                ? args.componentProperties
                : {};
            if (args.properties && typeof args.properties === 'object') propertyGroups[componentType] = args.properties;
            for (const [type, properties] of Object.entries(propertyGroups)) {
                const result = await this.setProperties({ nodeUuid, componentType: type, properties });
                if (!result.success) throw new Error(result.error || `Failed to set ${type} properties`);
            }

            if (args.nodeProperties && typeof args.nodeProperties === 'object') {
                for (const [property, value] of Object.entries(args.nodeProperties)) {
                    const result = await this.nodes.execute('set_node_property', { uuid: nodeUuid, property, value });
                    if (!result.success) throw new Error(result.error || `Failed to set node.${property}`);
                }
            }

            return {
                success: true,
                data: {
                    nodeUuid,
                    componentType,
                    descriptor,
                    inspection: (await this.inspect({ nodeUuid, includeProperties: true })).data
                }
            };
        } catch (error: any) {
            if (args.rollbackOnError !== false) await this.nodes.execute('delete_node', { uuid: nodeUuid }).catch(() => undefined);
            return { success: false, error: error?.message || String(error), data: { nodeUuid, rolledBack: args.rollbackOnError !== false } };
        }
    }

    private async addComponent(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        const descriptor = findUIComponent(componentType);
        const required = args.autoDependencies === false
            ? [componentType]
            : [...(descriptor?.dependencies || []), componentType];
        for (const type of Array.from(new Set(required))) {
            const result = await this.ensureComponent(nodeUuid, type);
            if (!result.success) return result;
        }
        if (args.properties && typeof args.properties === 'object') {
            return this.setProperties({ nodeUuid, componentType, properties: args.properties });
        }
        return this.inspect({ nodeUuid, includeProperties: true });
    }

    private async removeComponent(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        return this.components.execute('remove_component', { nodeUuid, componentType });
    }

    private async setProperties(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        const properties = args.properties;
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
            return { success: false, error: 'properties must be an object' };
        }

        const dump = await this.queryNode(nodeUuid);
        const match = this.findComponent(dump, componentType);
        if (!match) return { success: false, error: `Component ${componentType} not found on node` };
        const updated: string[] = [];
        for (const [property, input] of Object.entries(properties)) {
            const resolved = await this.resolveReferences(input);
            const existing = match.component?.[property];
            const propertyDump = this.buildPropertyDump(existing, resolved);
            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: `__comps__.${match.index}.${property}`,
                dump: propertyDump
            });
            updated.push(property);
        }
        return { success: true, data: { nodeUuid, componentType: match.type, updated } };
    }

    private async configureEvent(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        const eventProperty = String(args.eventProperty || '');
        const mode = ['add', 'replace', 'clear'].includes(args.mode) ? args.mode : 'add';
        if (!nodeUuid || !eventProperty) return { success: false, error: 'nodeUuid and eventProperty are required' };
        const descriptor = findUIComponent(componentType);
        if (descriptor && descriptor.eventProperties.length > 0 && !descriptor.eventProperties.includes(eventProperty)) {
            return { success: false, error: `${eventProperty} is not a documented event property for ${componentType}`, data: { supported: descriptor.eventProperties } };
        }
        const handlers = mode === 'clear' ? [] : (Array.isArray(args.handlers) ? args.handlers : [args.handler]).filter(Boolean);
        const options = {
            name: 'cocos-mcp-server',
            method: 'configureUIEvent',
            args: [nodeUuid, componentType, eventProperty, handlers, mode]
        };
        const result = await Editor.Message.request('scene', 'execute-scene-script', options);
        if (result?.success) Editor.Message.send('scene', 'snapshot');
        return result;
    }

    private async listEvents(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = normalizeUIComponentClass(args.componentType);
        if (!nodeUuid) return { success: false, error: 'nodeUuid is required' };
        const options = {
            name: 'cocos-mcp-server',
            method: 'getUIEventHandlers',
            args: [nodeUuid, componentType, args.eventProperty || null]
        };
        return Editor.Message.request('scene', 'execute-scene-script', options);
    }

    private async validateScene(args: any): Promise<ToolResponse> {
        const queried = await this.queryScene({
            rootUuid: args.rootUuid,
            maxNodes: args.maxNodes || 500,
            includeProperties: false,
            includeCustom: true
        });
        if (!queried.success) return queried;
        const issues: any[] = [];
        for (const node of queried.data.nodes || []) {
            const types = new Set((node.uiComponents || []).map((item: any) => item.type));
            for (const item of node.uiComponents || []) {
                const descriptor = findUIComponent(item.type);
                for (const dependency of descriptor?.dependencies || []) {
                    if (!types.has(dependency)) {
                        issues.push({ severity: 'error', nodeUuid: node.uuid, componentType: item.type, code: 'missing-dependency', dependency });
                    }
                }
            }
        }
        return {
            success: issues.every((issue) => issue.severity !== 'error'),
            data: {
                scannedNodes: queried.data.scannedNodes,
                uiNodeCount: queried.data.uiNodeCount,
                issueCount: issues.length,
                issues
            },
            ...(issues.length ? { error: `${issues.length} UI validation issue(s) found` } : {})
        };
    }

    private async ensureComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        const dump = await this.queryNode(nodeUuid);
        if (this.findComponent(dump, componentType)) return { success: true, data: { nodeUuid, componentType, existed: true } };
        return this.components.execute('add_component', { nodeUuid, componentType });
    }

    private async queryNode(nodeUuid: string): Promise<any> {
        return Editor.Message.request('scene', 'query-node', nodeUuid);
    }

    private findComponent(nodeDump: any, requested: string): { component: any; index: number; type: string } | null {
        const normalized = this.normalizeType(requested);
        const components = nodeDump?.__comps__ || [];
        for (let index = 0; index < components.length; index++) {
            const type = this.componentType(components[index]);
            if (this.normalizeType(type) === normalized) return { component: components[index], index, type };
        }
        return null;
    }

    private describeNode(nodeDump: any, includeProperties: boolean, includeCustom: boolean): any {
        const uiComponents: any[] = [];
        for (let index = 0; index < (nodeDump?.__comps__ || []).length; index++) {
            const component = nodeDump.__comps__[index];
            const type = this.componentType(component);
            const catalog = findUIComponent(type);
            const isUI = Boolean(catalog) || this.normalizeType(type) === 'uitransform';
            if (!isUI && !includeCustom) continue;
            if (!isUI && !this.looksLikeCustomUI(component)) continue;
            uiComponents.push({
                index,
                type,
                catalogId: catalog?.id || null,
                category: catalog?.category || 'custom',
                eventProperties: catalog?.eventProperties || [],
                uuid: this.dumpValue(component.uuid) || null,
                ...(includeProperties ? { properties: this.componentProperties(component) } : {})
            });
        }
        return {
            uuid: this.dumpValue(nodeDump?.uuid) || nodeDump?.uuid,
            name: this.dumpValue(nodeDump?.name) || nodeDump?.name,
            active: this.dumpValue(nodeDump?.active) ?? nodeDump?.active,
            uiComponents
        };
    }

    private componentProperties(component: any): Record<string, any> {
        const properties: Record<string, any> = {};
        for (const [key, value] of Object.entries(component || {})) {
            if (this.isInternalKey(key)) continue;
            properties[key] = this.dumpValue(value, 0);
        }
        return properties;
    }

    private describeProperty(value: any): any {
        if (!value || typeof value !== 'object') return { value };
        return {
            type: value.type || value.__type__ || typeof this.dumpValue(value),
            readonly: Boolean(value.readonly),
            visible: value.visible !== false,
            value: this.dumpValue(value)
        };
    }

    private buildPropertyDump(existing: any, value: any): any {
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
            const dump: any = { value };
            if (existing.type) dump.type = existing.type;
            if (existing.extends) dump.extends = existing.extends;
            return dump;
        }
        return { value };
    }

    private async resolveReferences(value: any): Promise<any> {
        if (Array.isArray(value)) return Promise.all(value.map((item) => this.resolveReferences(item)));
        if (!value || typeof value !== 'object') return value;
        if (value.$node) return { uuid: String(value.$node) };
        if (value.$asset) return { uuid: String(value.$asset) };
        if (value.$component) {
            const reference = value.$component;
            const target = await this.queryNode(String(reference.nodeUuid || reference.node));
            const match = this.findComponent(target, normalizeUIComponentClass(reference.type));
            if (!match) throw new Error(`Referenced component ${reference.type} not found`);
            const uuid = this.dumpValue(match.component.uuid);
            if (!uuid) throw new Error(`Referenced component ${reference.type} has no UUID`);
            return { uuid };
        }
        const result: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) result[key] = await this.resolveReferences(child);
        return result;
    }

    private componentType(component: any): string {
        return component?.__type__ || component?.type || component?.cid || component?.name || 'Unknown';
    }

    private normalizeType(value: string): string {
        return String(value || '').replace(/^cc\./, '').toLowerCase();
    }

    private looksLikeCustomUI(component: any): boolean {
        const name = this.normalizeType(this.componentType(component));
        return name.includes('ui') || name.includes('view') || name.includes('panel') || name.includes('screen') || name.includes('dialog');
    }

    private isInternalKey(key: string): boolean {
        return key.startsWith('_') || ['type', 'cid', 'name', 'extends', 'readonly', 'visible', 'editor'].includes(key);
    }

    private dumpValue(value: any, depth = 0): any {
        if (depth > 5) return '[depth-limit]';
        if (value === null || value === undefined || typeof value !== 'object') return value;
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return this.dumpValue(value.value, depth + 1);
        if (Array.isArray(value)) return value.slice(0, 200).map((item) => this.dumpValue(item, depth + 1));
        const result: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) {
            if (['readonly', 'visible', 'editor', 'extends'].includes(key)) continue;
            result[key] = this.dumpValue(child, depth + 1);
        }
        return result;
    }

    private findTreeNode(node: any, uuid: string): any | null {
        if (!node) return null;
        if (node.uuid === uuid) return node;
        for (const child of node.children || []) {
            const found = this.findTreeNode(child, uuid);
            if (found) return found;
        }
        return null;
    }
}
