import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';
// Slim MCP component tool adapter: direct Editor API calls only (no fallbacks).
export class ComponentTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'add_component':
                return await this.addComponent(args?.nodeUuid, args?.componentType);
            case 'remove_component':
                return await this.removeComponent(args?.nodeUuid, args?.componentType);
            case 'get_components':
                return await this.getComponents(args?.nodeUuid);
            case 'get_component_info':
                return await this.getComponentInfo(args?.nodeUuid, args?.componentType);
            case 'set_component_property':
                return await this.setComponentProperty(args);
            case 'attach_script':
                return await this.attachScript(args?.nodeUuid, args?.scriptPath);
            case 'get_available_components':
                return await this.getAvailableComponents(args?.category);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async addComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) {
            return { success: false, error: 'Missing nodeUuid or componentType' };
        }
        try {
            await Editor.Message.request('scene', 'create-component', {
                uuid: nodeUuid,
                component: componentType
            });
            return {
                success: true,
                data: { nodeUuid, componentType }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async removeComponent(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) {
            return { success: false, error: 'Missing nodeUuid or componentType' };
        }
        try {
            await Editor.Message.request('scene', 'remove-component', {
                uuid: nodeUuid,
                component: componentType
            });
            return {
                success: true,
                data: { nodeUuid, componentType }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getComponents(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) {
            return { success: false, error: 'Missing nodeUuid' };
        }
        try {
            const nodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
            if (!nodeData || !nodeData.__comps__) {
                return { success: false, error: 'Node not found or no components data' };
            }
            const components = nodeData.__comps__.map((comp: any) => ({
                type: comp.__type__ || comp.cid || comp.type || 'Unknown',
                uuid: comp.uuid?.value || comp.uuid || null,
                enabled: comp.enabled !== undefined ? comp.enabled : true,
                properties: this.extractComponentProperties(comp)
            }));
            return {
                success: true,
                data: { nodeUuid, components }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getComponentInfo(nodeUuid: string, componentType: string): Promise<ToolResponse> {
        if (!nodeUuid || !componentType) {
            return { success: false, error: 'Missing nodeUuid or componentType' };
        }
        const components = await this.getComponents(nodeUuid);
        if (!components.success || !components.data?.components) {
            return components;
        }
        const found = components.data.components.find((comp: any) => comp.type === componentType);
        if (!found) {
            return { success: false, error: `Component '${componentType}' not found on node` };
        }
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
        if (component && component.value && typeof component.value === 'object') {
            return component.value;
        }
        const properties: Record<string, any> = {};
        const excludeKeys = new Set([
            '__type__',
            'enabled',
            'node',
            '_id',
            '__scriptAsset',
            'uuid',
            'name',
            '_name',
            '_objFlags',
            '_enabled',
            'type',
            'readonly',
            'visible',
            'cid',
            'editor',
            'extends'
        ]);
        if (!component || typeof component !== 'object') {
            return properties;
        }
        for (const key of Object.keys(component)) {
            if (!excludeKeys.has(key) && !key.startsWith('_')) {
                properties[key] = component[key];
            }
        }
        return properties;
    }

    // Normalize input into the shape expected by Editor `set-property`.

    private normalizeValue(propertyType: string | undefined, value: any): { value: any; dumpType?: string } {
        const type = propertyType || 'raw';
        switch (type) {
            case 'string':
                return { value: String(value ?? '') };
            case 'number':
            case 'integer':
            case 'float': {
                const num = Number(value);
                return { value: Number.isFinite(num) ? num : 0 };
            }
            case 'boolean':
                return { value: Boolean(value) };
            case 'color': {
                if (typeof value === 'string') {
                    const hex = value.startsWith('#') ? value.slice(1) : value;
                    if (hex.length === 6 || hex.length === 8) {
                        const r = parseInt(hex.slice(0, 2), 16);
                        const g = parseInt(hex.slice(2, 4), 16);
                        const b = parseInt(hex.slice(4, 6), 16);
                        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
                        return { value: { r, g, b, a }, dumpType: 'cc.Color' };
                    }
                    throw new Error('Invalid color string');
                }
                if (typeof value === 'object' && value !== null) {
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
            case 'vec2':
                return { value: { x: Number(value?.x) || 0, y: Number(value?.y) || 0 }, dumpType: 'cc.Vec2' };
            case 'vec3':
                return { value: { x: Number(value?.x) || 0, y: Number(value?.y) || 0, z: Number(value?.z) || 0 }, dumpType: 'cc.Vec3' };
            case 'size':
                return { value: { width: Number(value?.width) || 0, height: Number(value?.height) || 0 }, dumpType: 'cc.Size' };
            case 'node':
                if (typeof value === 'string') {
                    return { value: { uuid: value }, dumpType: 'cc.Node' };
                }
                throw new Error('Node value must be a UUID string');
            case 'component':
                if (typeof value === 'string') {
                    return { value: { uuid: value }, dumpType: 'cc.Component' };
                }
                throw new Error('Component value must be a UUID string');
            case 'spriteFrame':
                if (typeof value === 'string') {
                    return { value: { uuid: value }, dumpType: 'cc.SpriteFrame' };
                }
                throw new Error('SpriteFrame value must be a UUID string');
            case 'prefab':
                if (typeof value === 'string') {
                    return { value: { uuid: value }, dumpType: 'cc.Prefab' };
                }
                throw new Error('Prefab value must be a UUID string');
            case 'asset':
                if (typeof value === 'string') {
                    return { value: { uuid: value } };
                }
                throw new Error('Asset value must be a UUID string');
            case 'nodeArray':
                if (Array.isArray(value)) {
                    return { value: value.map((item) => ({ uuid: String(item) })) };
                }
                throw new Error('NodeArray value must be an array');
            case 'colorArray':
                if (Array.isArray(value)) {
                    return {
                        value: value.map((item) => ({
                            r: Number(item?.r) || 0,
                            g: Number(item?.g) || 0,
                            b: Number(item?.b) || 0,
                            a: item?.a !== undefined ? Number(item.a) : 255
                        }))
                    };
                }
                throw new Error('ColorArray value must be an array');
            case 'numberArray':
                if (Array.isArray(value)) {
                    return { value: value.map((item) => Number(item)) };
                }
                throw new Error('NumberArray value must be an array');
            case 'stringArray':
                if (Array.isArray(value)) {
                    return { value: value.map((item) => String(item)) };
                }
                throw new Error('StringArray value must be an array');
            default:
                return { value: value };
        }
    }

    // Single-pass property setter: resolve component index and apply a direct `set-property`.

    private async setComponentProperty(args: any): Promise<ToolResponse> {
        const nodeUuid = args?.nodeUuid;
        const componentType = args?.componentType;
        const property = args?.property;
        const propertyType = args?.propertyType;
        const value = args?.value;

        if (!nodeUuid || !componentType || !property) {
            return { success: false, error: 'Missing nodeUuid, componentType, or property' };
        }

        try {
            const nodeData = await Editor.Message.request('scene', 'query-node', nodeUuid);
            if (!nodeData || !nodeData.__comps__) {
                return { success: false, error: 'Node not found or no components data' };
            }

            const index = nodeData.__comps__.findIndex((comp: any) => {
                const compType = comp.__type__ || comp.cid || comp.type || 'Unknown';
                return compType === componentType;
            });

            if (index < 0) {
                return { success: false, error: `Component '${componentType}' not found on node` };
            }

            const normalized = this.normalizeValue(propertyType, value);
            const dump: any = { value: normalized.value };
            if (normalized.dumpType) {
                dump.type = normalized.dumpType;
            }

            await Editor.Message.request('scene', 'set-property', {
                uuid: nodeUuid,
                path: `__comps__.${index}.${property}`,
                dump
            });

            return {
                success: true,
                data: { nodeUuid, componentType, property }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async attachScript(nodeUuid: string, scriptPath: string): Promise<ToolResponse> {
        if (!nodeUuid || !scriptPath) {
            return { success: false, error: 'Missing nodeUuid or scriptPath' };
        }
        const scriptName = scriptPath.split('/').pop()?.replace('.ts', '').replace('.js', '');
        if (!scriptName) {
            return { success: false, error: 'Invalid script path' };
        }
        return this.addComponent(nodeUuid, scriptName);
    }

    private async getAvailableComponents(category: string = 'all'): Promise<ToolResponse> {
        const componentCategories: Record<string, string[]> = {
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

        let components: string[] = [];
        if (category === 'all') {
            for (const cat in componentCategories) {
                components = components.concat(componentCategories[cat]);
            }
        } else if (componentCategories[category]) {
            components = componentCategories[category];
        }

        return {
            success: true,
            data: {
                category,
                components
            }
        };
    }
}
