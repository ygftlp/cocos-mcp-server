import { ComponentAdapter } from '../adapters/contracts/component-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export class ComponentTools implements ToolExecutor {
    constructor(private readonly adapter: ComponentAdapter = selectCocosAdapter().component) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'add_component': return this.addComponent(args?.nodeUuid, args?.componentType);
            case 'remove_component': return this.removeComponent(args?.nodeUuid, args?.componentType);
            case 'get_components': return this.getComponents(args?.nodeUuid);
            case 'get_component_info': return this.getComponentInfo(args?.nodeUuid, args?.componentType);
            case 'set_component_property': return this.setComponentProperty(args);
            case 'attach_script': return this.attachScript(args?.nodeUuid, args?.scriptPath);
            case 'get_available_components': return this.getAvailableComponents(args?.category);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async addComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) return { success: false, error: 'Missing nodeUuid or componentType' };
        try {
            await this.adapter.createComponent(nodeUuid, componentType);
            return { success: true, data: { nodeUuid, componentType } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async removeComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) return { success: false, error: 'Missing nodeUuid or componentType' };
        try {
            await this.adapter.removeComponent(nodeUuid, componentType);
            return { success: true, data: { nodeUuid, componentType } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getComponents(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) return { success: false, error: 'Missing nodeUuid' };
        try {
            const nodeData = await this.adapter.queryNode(nodeUuid);
            if (!nodeData || !nodeData.__comps__) return { success: false, error: 'Node not found or no components data' };
            const components = nodeData.__comps__.map((component: any) => ({
                type: component.__type__ || component.cid || component.type || 'Unknown',
                uuid: this.dumpValue(component.uuid) || null,
                enabled: Boolean(this.dumpValue(component.enabled) ?? true),
                properties: this.extractComponentProperties(component)
            }));
            return { success: true, data: { nodeUuid, components } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getComponentInfo(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) return { success: false, error: 'Missing nodeUuid or componentType' };
        const result = await this.getComponents(nodeUuid);
        if (!result.success || !result.data?.components) return result;
        const found = result.data.components.find((component: any) => component.type === componentType);
        if (!found) return { success: false, error: `Component '${componentType}' not found on node` };
        return {
            success: true,
            data: {
                nodeUuid,
                componentType,
                enabled: found.enabled,
                properties: found.properties
            }
        };
    }

    private extractComponentProperties(component: any): Record<string, any> {
        if (component?.value && typeof component.value === 'object') return this.dumpValue(component.value);
        const properties: Record<string, any> = {};
        const excluded = new Set([
            '__type__', 'enabled', 'node', '_id', '__scriptAsset', 'uuid', 'name', '_name',
            '_objFlags', '_enabled', 'type', 'readonly', 'visible', 'cid', 'editor', 'extends'
        ]);
        if (!component || typeof component !== 'object') return properties;
        for (const key of Object.keys(component)) {
            if (!excluded.has(key) && !key.startsWith('_')) properties[key] = this.dumpValue(component[key]);
        }
        return properties;
    }

    private normalizeValue(propertyType: string | undefined, value: any): { value: any; dumpType?: string } {
        switch (propertyType || 'raw') {
            case 'string': return { value: String(value ?? '') };
            case 'number':
            case 'integer':
            case 'float': {
                const number = Number(value);
                return { value: Number.isFinite(number) ? number : 0 };
            }
            case 'boolean': return { value: Boolean(value) };
            case 'color': {
                if (typeof value === 'string') {
                    const hex = value.startsWith('#') ? value.slice(1) : value;
                    if (hex.length !== 6 && hex.length !== 8) throw new Error('Invalid color string');
                    return {
                        value: {
                            r: parseInt(hex.slice(0, 2), 16),
                            g: parseInt(hex.slice(2, 4), 16),
                            b: parseInt(hex.slice(4, 6), 16),
                            a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255
                        },
                        dumpType: 'cc.Color'
                    };
                }
                if (value && typeof value === 'object') {
                    return {
                        value: {
                            r: Number(value.r) || 0,
                            g: Number(value.g) || 0,
                            b: Number(value.b) || 0,
                            a: value.a !== undefined ? Number(value.a) : 255
                        },
                        dumpType: 'cc.Color'
                    };
                }
                throw new Error('Invalid color value');
            }
            case 'vec2': return { value: { x: Number(value?.x) || 0, y: Number(value?.y) || 0 }, dumpType: 'cc.Vec2' };
            case 'vec3': return { value: { x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 }, dumpType: 'cc.Vec3' };
            case 'size': return { value: { width: Number(value?.width) || 0, height: Number(value?.height) || 0 }, dumpType: 'cc.Size' };
            case 'node': return this.uuidValue(value, 'cc.Node', 'Node');
            case 'component': return this.uuidValue(value, 'cc.Component', 'Component');
            case 'spriteFrame': return this.uuidValue(value, 'cc.SpriteFrame', 'SpriteFrame');
            case 'prefab': return this.uuidValue(value, 'cc.Prefab', 'Prefab');
            case 'asset': return this.uuidValue(value, undefined, 'Asset');
            case 'nodeArray':
                if (!Array.isArray(value)) throw new Error('NodeArray value must be an array');
                return { value: value.map((item) => ({ uuid: String(item) })) };
            case 'colorArray':
                if (!Array.isArray(value)) throw new Error('ColorArray value must be an array');
                return {
                    value: value.map((item) => ({
                        r: Number(item?.r) || 0,
                        g: Number(item?.g) || 0,
                        b: Number(item?.b) || 0,
                        a: item?.a !== undefined ? Number(item.a) : 255
                    }))
                };
            case 'numberArray':
                if (!Array.isArray(value)) throw new Error('NumberArray value must be an array');
                return { value: value.map((item) => Number(item)) };
            case 'stringArray':
                if (!Array.isArray(value)) throw new Error('StringArray value must be an array');
                return { value: value.map((item) => String(item)) };
            default: return { value };
        }
    }

    private uuidValue(value: any, dumpType: string | undefined, label: string): { value: any; dumpType?: string } {
        if (typeof value !== 'string') throw new Error(`${label} value must be a UUID string`);
        return { value: { uuid: value }, ...(dumpType ? { dumpType } : {}) };
    }

    private async setComponentProperty(args: any): Promise<ToolResponse> {
        const nodeUuid = args?.nodeUuid;
        const componentType = args?.componentType;
        const property = args?.property;
        if (!nodeUuid || !componentType || !property) {
            return { success: false, error: 'Missing nodeUuid, componentType, or property' };
        }

        try {
            const nodeData = await this.adapter.queryNode(nodeUuid);
            if (!nodeData || !nodeData.__comps__) return { success: false, error: 'Node not found or no components data' };
            const index = nodeData.__comps__.findIndex((component: any) => {
                const type = component.__type__ || component.cid || component.type || 'Unknown';
                return type === componentType;
            });
            if (index < 0) return { success: false, error: `Component '${componentType}' not found on node` };

            const normalized = this.normalizeValue(args?.propertyType, args?.value);
            const dump: any = { value: normalized.value };
            if (normalized.dumpType) dump.type = normalized.dumpType;
            await this.adapter.setSerializedProperty({
                uuid: nodeUuid,
                path: `__comps__.${index}.${property}`,
                dump
            });
            return { success: true, data: { nodeUuid, componentType, property } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async attachScript(nodeUuid: string, scriptPath: string): Promise<ToolResponse> {
        if (!nodeUuid || !scriptPath) return { success: false, error: 'Missing nodeUuid or scriptPath' };
        const scriptName = scriptPath.split('/').pop()?.replace('.ts', '').replace('.js', '');
        if (!scriptName) return { success: false, error: 'Invalid script path' };
        return this.addComponent(nodeUuid, scriptName);
    }

    private async getAvailableComponents(category = 'all'): Promise<ToolResponse> {
        const categories: Record<string, string[]> = {
            renderer: ['cc.Sprite', 'cc.Label', 'cc.RichText', 'cc.Mask', 'cc.Graphics'],
            ui: ['cc.Button', 'cc.Toggle', 'cc.Slider', 'cc.ScrollView', 'cc.EditBox', 'cc.ProgressBar'],
            physics: ['cc.RigidBody2D', 'cc.BoxCollider2D', 'cc.CircleCollider2D', 'cc.PolygonCollider2D'],
            animation: ['cc.Animation', 'cc.AnimationClip', 'cc.SkeletalAnimation'],
            audio: ['cc.AudioSource'],
            layout: ['cc.Layout', 'cc.Widget', 'cc.PageView', 'cc.PageViewIndicator'],
            effects: ['cc.MotionStreak', 'cc.ParticleSystem2D'],
            camera: ['cc.Camera'],
            light: ['cc.Light', 'cc.DirectionalLight', 'cc.PointLight', 'cc.SpotLight']
        };
        const components = category === 'all'
            ? Object.values(categories).flat()
            : (categories[category] || []);
        return { success: true, data: { category, components } };
    }

    private dumpValue(value: any, depth = 0): any {
        if (depth > 6) return '[depth-limit]';
        if (value === null || value === undefined || typeof value !== 'object') return value;
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return this.dumpValue(value.value, depth + 1);
        if (Array.isArray(value)) return value.map((item) => this.dumpValue(item, depth + 1));
        const result: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) {
            if (['readonly', 'visible', 'editor', 'extends'].includes(key)) continue;
            result[key] = this.dumpValue(child, depth + 1);
        }
        return result;
    }
}
