import { ComponentAdapter } from '../adapters/contracts/component-adapter';
import { SceneAdvancedAdapter } from '../adapters/contracts/scene-advanced-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';

interface ComponentMatch {
    index: number;
    type: string;
    component: any;
}

interface ValidationIssue {
    path: string;
    code: string;
    message: string;
    expected?: any;
    actual?: any;
}

export class ComponentReflectionTools implements ToolExecutor {
    constructor(
        private readonly componentAdapter: ComponentAdapter = selectCocosAdapter().component,
        private readonly sceneAdapter: SceneAdvancedAdapter = selectCocosAdapter().sceneAdvanced
    ) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'list_component_classes': return this.listComponentClasses(args || {});
            case 'get_component_schema': return this.getComponentSchema(args || {});
            case 'validate_component_properties': return this.validateComponentProperties(args || {});
            case 'set_component_properties': return this.setComponentProperties(args || {});
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async listComponentClasses(args: any): Promise<ToolResponse> {
        const filter = String(args.filter || '').trim().toLowerCase();
        const maxResults = Math.max(1, Math.min(2000, Number(args.maxResults) || 500));
        const includeBuiltin = args.includeBuiltin !== false;
        const includeProject = args.includeProject !== false;
        const includeScriptStatus = Boolean(args.includeScriptStatus);

        try {
            const [components, classes] = await Promise.all([
                this.sceneAdapter.queryComponents().catch(() => []),
                this.sceneAdapter.queryClasses('cc.Component').catch(() => [])
            ]);

            const merged = new Map<string, any>();
            for (const [source, values] of [['components', components], ['classes', classes]] as const) {
                for (const item of Array.isArray(values) ? values : []) {
                    const normalized = this.normalizeClass(item, source);
                    if (!normalized) continue;
                    const key = normalized.name.toLowerCase();
                    const existing = merged.get(key);
                    merged.set(key, existing ? { ...existing, ...normalized, sources: Array.from(new Set([...(existing.sources || []), source])) } : normalized);
                }
            }

            let result = Array.from(merged.values()).filter((item) => {
                if (!includeBuiltin && item.builtin) return false;
                if (!includeProject && !item.builtin) return false;
                if (!filter) return true;
                return `${item.name} ${item.displayName || ''}`.toLowerCase().includes(filter);
            });
            result.sort((a, b) => a.name.localeCompare(b.name));
            result = result.slice(0, maxResults);

            if (includeScriptStatus) {
                const limited = result.slice(0, 100);
                await Promise.all(limited.map(async (item) => {
                    try {
                        item.hasScript = await this.sceneAdapter.queryComponentHasScript(item.name);
                    } catch {
                        item.hasScript = null;
                    }
                }));
            }

            return {
                success: true,
                data: {
                    count: result.length,
                    truncated: merged.size > result.length,
                    classes: result,
                    note: 'Property schemas are derived from live serialized component instances via get_component_schema.'
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getComponentSchema(args: any): Promise<ToolResponse> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = String(args.componentType || '');
        const includeHidden = Boolean(args.includeHidden);
        const includeValues = args.includeValues !== false;
        const maxDepth = Math.max(1, Math.min(8, Number(args.maxDepth) || 4));
        if (!nodeUuid || !componentType) return { success: false, error: 'nodeUuid and componentType are required' };

        try {
            const node = await this.componentAdapter.queryNode(nodeUuid);
            const match = this.findComponent(node, componentType);
            if (!match) return { success: false, error: `Component '${componentType}' not found on node` };
            const properties: Record<string, any> = {};
            for (const [name, dump] of Object.entries(match.component || {})) {
                if (this.isInternalKey(name)) continue;
                const descriptor = this.describeProperty(name, dump, includeValues, maxDepth, 0);
                if (!includeHidden && descriptor.visible === false) continue;
                properties[name] = descriptor;
            }
            return {
                success: true,
                data: {
                    nodeUuid,
                    componentType: match.type,
                    componentIndex: match.index,
                    propertyCount: Object.keys(properties).length,
                    properties
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async validateComponentProperties(args: any): Promise<ToolResponse> {
        const context = await this.loadValidationContext(args);
        if (!context.success) return context.response;
        const issues: ValidationIssue[] = [];
        const normalized: Record<string, any> = {};

        for (const [propertyPath, input] of Object.entries(context.properties)) {
            const dump = this.resolveDump(context.match.component, propertyPath);
            if (!dump.found) {
                if (!context.allowUnknown) {
                    issues.push({ path: propertyPath, code: 'unknown-property', message: `Unknown serialized property: ${propertyPath}` });
                } else {
                    normalized[propertyPath] = input;
                }
                continue;
            }
            const descriptor = this.describeProperty(propertyPath, dump.value, true, 4, 0);
            issues.push(...this.validateValue(propertyPath, input, descriptor));
            normalized[propertyPath] = input;
        }

        return {
            success: issues.length === 0,
            ...(issues.length ? { error: `${issues.length} component property validation issue(s) found` } : {}),
            data: {
                nodeUuid: context.nodeUuid,
                componentType: context.match.type,
                valid: issues.length === 0,
                issueCount: issues.length,
                issues,
                normalized
            }
        };
    }

    private async setComponentProperties(args: any): Promise<ToolResponse> {
        const context = await this.loadValidationContext(args);
        if (!context.success) return context.response;
        const validation = await this.validateComponentProperties(args);
        if (!validation.success) return validation;
        const dryRun = Boolean(args.dryRun);
        const updates: any[] = [];

        try {
            for (const [propertyPath, input] of Object.entries(context.properties)) {
                const dump = this.resolveDump(context.match.component, propertyPath);
                const resolved = await this.resolveReferences(input);
                const propertyDump = this.buildPropertyDump(dump.found ? dump.value : null, resolved);
                const fullPath = `__comps__.${context.match.index}.${propertyPath}`;
                updates.push({ propertyPath, fullPath, value: resolved, dump: propertyDump });
                if (!dryRun) {
                    await this.componentAdapter.setSerializedProperty({
                        uuid: context.nodeUuid,
                        path: fullPath,
                        dump: propertyDump
                    });
                }
            }
            return {
                success: true,
                data: {
                    nodeUuid: context.nodeUuid,
                    componentType: context.match.type,
                    dryRun,
                    updateCount: updates.length,
                    updates
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error), data: { updates } };
        }
    }

    private async loadValidationContext(args: any): Promise<any> {
        const nodeUuid = String(args.nodeUuid || '');
        const componentType = String(args.componentType || '');
        const properties = args.properties;
        if (!nodeUuid || !componentType) {
            return { success: false, response: { success: false, error: 'nodeUuid and componentType are required' } };
        }
        if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
            return { success: false, response: { success: false, error: 'properties must be an object keyed by serialized property path' } };
        }
        try {
            const node = await this.componentAdapter.queryNode(nodeUuid);
            const match = this.findComponent(node, componentType);
            if (!match) {
                return { success: false, response: { success: false, error: `Component '${componentType}' not found on node` } };
            }
            return {
                success: true,
                nodeUuid,
                match,
                properties,
                allowUnknown: Boolean(args.allowUnknown)
            };
        } catch (error: any) {
            return { success: false, response: { success: false, error: error?.message || String(error) } };
        }
    }

    private normalizeClass(item: any, source: string): any | null {
        const name = typeof item === 'string'
            ? item
            : item?.name || item?.className || item?.cid || item?.type || item?.__type__;
        if (!name || typeof name !== 'string') return null;
        const builtin = /^(cc|sp|dragonBones)\./.test(name);
        return {
            name,
            displayName: item?.displayName || item?.display || name.replace(/^(cc|sp|dragonBones)\./, ''),
            builtin,
            source: builtin ? 'engine' : 'project',
            sources: [source],
            ...(item && typeof item === 'object' ? {
                scriptUuid: this.unwrap(item.scriptUuid || item.script || item.__scriptAsset) || null,
                category: item.category || null
            } : {})
        };
    }

    private findComponent(node: any, requestedType: string): ComponentMatch | null {
        const normalized = this.normalizeType(requestedType);
        const components = node?.__comps__ || node?.components || [];
        for (let index = 0; index < components.length; index++) {
            const component = components[index];
            const type = component?.__type__ || component?.cid || component?.type || component?.name || 'Unknown';
            if (this.normalizeType(type) === normalized) return { index, type, component };
        }
        return null;
    }

    private resolveDump(root: any, propertyPath: string): { found: boolean; value: any } {
        const segments = String(propertyPath).split('.').filter(Boolean);
        let current = root;
        for (const segment of segments) {
            if (!current || typeof current !== 'object') return { found: false, value: undefined };
            const container = Object.prototype.hasOwnProperty.call(current, 'value') && current.value && typeof current.value === 'object'
                ? current.value
                : current;
            if (!Object.prototype.hasOwnProperty.call(container, segment)) return { found: false, value: undefined };
            current = container[segment];
        }
        return { found: true, value: current };
    }

    private describeProperty(path: string, dump: any, includeValue: boolean, maxDepth: number, depth: number): any {
        const metadata = dump && typeof dump === 'object' && !Array.isArray(dump) ? dump : {};
        const value = this.unwrap(dump);
        const serializationType = String(metadata.type || metadata.__type__ || metadata.extends || this.inferType(value));
        const descriptor: any = {
            path,
            serializationType,
            valueType: this.inferValueType(value, serializationType),
            readonly: Boolean(metadata.readonly),
            visible: metadata.visible !== false,
            nullable: value === null,
            array: Array.isArray(value)
        };
        const enumValues = this.extractEnumValues(metadata);
        if (enumValues.length) descriptor.enumValues = enumValues;
        const min = this.numberMetadata(metadata, ['min', 'minimum']);
        const max = this.numberMetadata(metadata, ['max', 'maximum']);
        const step = this.numberMetadata(metadata, ['step']);
        if (min !== null) descriptor.minimum = min;
        if (max !== null) descriptor.maximum = max;
        if (step !== null) descriptor.step = step;
        if (metadata.extends) descriptor.assetType = metadata.extends;
        if (includeValue) descriptor.value = value;

        if (depth < maxDepth && value && typeof value === 'object' && !Array.isArray(value) && !this.isReferenceValue(value)) {
            const children: Record<string, any> = {};
            const childContainer = metadata.value && typeof metadata.value === 'object' ? metadata.value : value;
            for (const [key, child] of Object.entries(childContainer)) {
                if (this.isInternalKey(key)) continue;
                children[key] = this.describeProperty(`${path}.${key}`, child, includeValue, maxDepth, depth + 1);
            }
            if (Object.keys(children).length) descriptor.children = children;
        }
        return descriptor;
    }

    private validateValue(path: string, input: any, descriptor: any): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        if (descriptor.readonly) {
            issues.push({ path, code: 'readonly-property', message: `${path} is readonly` });
            return issues;
        }
        if (input === null) {
            if (!descriptor.nullable && !['reference', 'asset'].includes(descriptor.valueType)) {
                issues.push({ path, code: 'null-not-allowed', message: `${path} does not accept null` });
            }
            return issues;
        }

        const actualType = Array.isArray(input) ? 'array' : typeof input;
        const expected = descriptor.valueType;
        const isReference = this.isReferenceInput(input);
        if (expected === 'array' && !Array.isArray(input)) {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be an array`, expected: 'array', actual: actualType });
        } else if (expected === 'boolean' && typeof input !== 'boolean') {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be a boolean`, expected: 'boolean', actual: actualType });
        } else if (expected === 'number' && (typeof input !== 'number' || !Number.isFinite(input))) {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be a finite number`, expected: 'number', actual: actualType });
        } else if (expected === 'string' && typeof input !== 'string') {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be a string`, expected: 'string', actual: actualType });
        } else if (['reference', 'asset'].includes(expected) && !(typeof input === 'string' || isReference || this.isReferenceValue(input))) {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be a UUID or MCP reference`, expected: 'reference', actual: actualType });
        } else if (expected === 'object' && (typeof input !== 'object' || Array.isArray(input))) {
            issues.push({ path, code: 'type-mismatch', message: `${path} must be an object`, expected: 'object', actual: actualType });
        }

        if (typeof input === 'number') {
            if (descriptor.minimum !== undefined && input < descriptor.minimum) {
                issues.push({ path, code: 'minimum', message: `${path} must be >= ${descriptor.minimum}`, expected: descriptor.minimum, actual: input });
            }
            if (descriptor.maximum !== undefined && input > descriptor.maximum) {
                issues.push({ path, code: 'maximum', message: `${path} must be <= ${descriptor.maximum}`, expected: descriptor.maximum, actual: input });
            }
        }
        if (Array.isArray(descriptor.enumValues) && descriptor.enumValues.length) {
            const allowed = descriptor.enumValues.flatMap((entry: any) => [entry.value, entry.name]).filter((value: any) => value !== undefined);
            if (!allowed.includes(input)) {
                issues.push({ path, code: 'enum', message: `${path} is not an allowed enum value`, expected: allowed, actual: input });
            }
        }
        return issues;
    }

    private buildPropertyDump(existing: any, value: any): any {
        const dump: any = { value };
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
            for (const key of ['type', 'extends', 'bitmaskList', 'enumList']) {
                if (existing[key] !== undefined) dump[key] = existing[key];
            }
        }
        return dump;
    }

    private async resolveReferences(value: any): Promise<any> {
        if (Array.isArray(value)) return Promise.all(value.map((item) => this.resolveReferences(item)));
        if (!value || typeof value !== 'object') return value;
        if (value.$node) return { uuid: String(value.$node) };
        if (value.$asset) return { uuid: String(value.$asset) };
        if (value.$component) {
            const reference = value.$component;
            const nodeUuid = String(reference.nodeUuid || reference.node || '');
            const type = String(reference.type || '');
            if (!nodeUuid || !type) throw new Error('$component requires nodeUuid (or node) and type');
            const node = await this.componentAdapter.queryNode(nodeUuid);
            const match = this.findComponent(node, type);
            if (!match) throw new Error(`Referenced component '${type}' not found on node ${nodeUuid}`);
            const uuid = this.unwrap(match.component?.uuid);
            if (!uuid) throw new Error(`Referenced component '${type}' has no UUID`);
            return { uuid: String(uuid) };
        }
        const result: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) result[key] = await this.resolveReferences(child);
        return result;
    }

    private extractEnumValues(metadata: any): any[] {
        const source = metadata.enumList || metadata.enumData || metadata.enum;
        if (Array.isArray(source)) {
            return source.map((entry) => typeof entry === 'object' ? { name: entry.name ?? entry.label ?? String(entry.value), value: entry.value } : { name: String(entry), value: entry });
        }
        if (source && typeof source === 'object') {
            return Object.entries(source).map(([name, value]) => ({ name, value }));
        }
        return [];
    }

    private numberMetadata(metadata: any, keys: string[]): number | null {
        for (const key of keys) {
            const value = this.unwrap(metadata?.[key]);
            const number = Number(value);
            if (value !== undefined && value !== null && Number.isFinite(number)) return number;
        }
        return null;
    }

    private inferValueType(value: any, serializationType: string): string {
        const type = serializationType.toLowerCase();
        if (Array.isArray(value) || type.includes('array')) return 'array';
        if (type.includes('bool')) return 'boolean';
        if (type.includes('float') || type.includes('int') || type.includes('number') || type.includes('enum') || type.includes('bitmask')) return 'number';
        if (type.includes('string')) return 'string';
        if (type.includes('asset') || type.includes('spriteframe') || type.includes('prefab') || type.includes('texture') || type.includes('material') || type.includes('audioclip')) return 'asset';
        if (type.includes('node') || type.includes('component')) return 'reference';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') return 'string';
        if (this.isReferenceValue(value)) return 'reference';
        if (value && typeof value === 'object') return 'object';
        return typeof value;
    }

    private inferType(value: any): string {
        if (Array.isArray(value)) return 'Array';
        if (value === null) return 'null';
        if (value && typeof value === 'object' && value.uuid) return 'Reference';
        return typeof value;
    }

    private isReferenceInput(value: any): boolean {
        return Boolean(value && typeof value === 'object' && (value.$node || value.$asset || value.$component));
    }

    private isReferenceValue(value: any): boolean {
        return Boolean(value && typeof value === 'object' && typeof value.uuid === 'string');
    }

    private unwrap(value: any, depth = 0): any {
        if (depth > 8) return '[depth-limit]';
        if (value === null || value === undefined || typeof value !== 'object') return value;
        if (Object.prototype.hasOwnProperty.call(value, 'value')) return this.unwrap(value.value, depth + 1);
        if (Array.isArray(value)) return value.map((item) => this.unwrap(item, depth + 1));
        const result: Record<string, any> = {};
        for (const [key, child] of Object.entries(value)) {
            if (['readonly', 'visible', 'editor', 'extends', 'type', 'enumList', 'enumData', 'bitmaskList'].includes(key)) continue;
            result[key] = this.unwrap(child, depth + 1);
        }
        return result;
    }

    private normalizeType(value: string): string {
        return String(value || '').replace(/^cc\./, '').toLowerCase();
    }

    private isInternalKey(key: string): boolean {
        return key.startsWith('_') || ['__type__', 'type', 'cid', 'name', 'uuid', 'node', 'enabled', 'readonly', 'visible', 'editor', 'extends'].includes(key);
    }
}
