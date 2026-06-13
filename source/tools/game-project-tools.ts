import * as fs from 'fs';
import * as path from 'path';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { ComponentTools } from './component-tools';
import { NodeTools } from './node-tools';
import { SceneTools } from './scene-tools';
import { arcadeClickerSource } from './game-project-template';

type FileSpec = { path: string; content: string };
type ComponentSpec = { type: string; properties?: Record<string, any> };
type NodeSpec = {
    id: string;
    name: string;
    parentId?: string;
    position?: { x?: number; y?: number; z?: number };
    rotation?: { x?: number; y?: number; z?: number };
    scale?: { x?: number; y?: number; z?: number };
    components?: ComponentSpec[];
};
type Blueprint = { files: FileSpec[]; nodes: NodeSpec[]; entryComponent?: string };

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class GameProjectTools implements ToolExecutor {
    private scene = new SceneTools();
    private nodes = new NodeTools();
    private components = new ComponentTools();

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        if (toolName !== 'create_game') throw new Error(`Unknown tool: ${toolName}`);
        try {
            const plan = this.plan(args || {});
            if (plan.dryRun) return { success: true, data: { phase: 'planned', ...this.publicPlan(plan) } };
            return await this.apply(plan);
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private plan(args: any): any {
        const template = args.template === 'custom' ? 'custom' : 'arcade-clicker-2d';
        const projectName = this.name(args.projectName || Editor.Project.name || 'CocosGame', 'projectName');
        const rootAbsolute = this.assetRoot(args.root || 'assets/game');
        const rootDbUrl = this.dbUrl(rootAbsolute);
        const sceneName = this.name(args.sceneName || 'Main', 'sceneName');
        const folder = this.sceneFolder(args.sceneFolder || 'scenes', rootDbUrl);
        const blueprint = template === 'custom' ? this.customBlueprint(args.blueprint) : this.arcadeBlueprint(projectName);
        this.validate(blueprint, rootAbsolute);
        const requested = Number(args.scriptWaitMs);
        return {
            template, projectName, rootAbsolute, rootDbUrl, sceneName,
            sceneUrl: `${folder}/${sceneName}.scene`, sceneFolder: folder,
            overwrite: Boolean(args.overwrite), dryRun: Boolean(args.dryRun),
            scriptWaitMs: Number.isFinite(requested) ? Math.max(1000, Math.min(120000, Math.floor(requested))) : 30000,
            blueprint
        };
    }

    private async apply(plan: any): Promise<ToolResponse> {
        const journal: any[] = [];
        const existing = await this.queryAsset(plan.sceneUrl);
        if (existing && !plan.overwrite) {
            return { success: false, error: `Scene already exists: ${plan.sceneUrl}`, data: { phase: 'preflight' } };
        }

        const files = this.writeFiles(plan);
        journal.push({ phase: 'files', ...files });
        await Editor.Message.request('asset-db', 'refresh-asset', plan.rootDbUrl);
        journal.push({ phase: 'asset-refresh' });

        if (existing) await Editor.Message.request('asset-db', 'delete-asset', plan.sceneUrl);
        const created = await this.scene.execute('create_scene', { sceneName: plan.sceneName, savePath: plan.sceneFolder });
        if (!created.success) throw new Error(created.error || 'Scene creation failed');
        const opened = await this.scene.execute('open_scene', { scenePath: plan.sceneUrl });
        if (!opened.success) throw new Error(opened.error || 'Scene open failed');
        journal.push({ phase: 'scene-open', sceneUrl: plan.sceneUrl });

        const nodeIds = new Map<string, string>();
        for (const spec of plan.blueprint.nodes as NodeSpec[]) {
            const parentUuid = spec.parentId ? nodeIds.get(spec.parentId) : undefined;
            const result = await this.nodes.execute('create_node', { name: spec.name, parentUuid });
            if (!result.success || !result.data?.uuid) throw new Error(result.error || `Failed to create node ${spec.id}`);
            nodeIds.set(spec.id, result.data.uuid);
            if (spec.position || spec.rotation || spec.scale) {
                const transform = await this.nodes.execute('set_node_transform', { uuid: result.data.uuid, position: spec.position, rotation: spec.rotation, scale: spec.scale });
                if (!transform.success) throw new Error(transform.error || `Failed to transform node ${spec.id}`);
            }
        }

        const deadline = Date.now() + plan.scriptWaitMs;
        for (const spec of plan.blueprint.nodes as NodeSpec[]) {
            const nodeUuid = nodeIds.get(spec.id)!;
            for (const component of spec.components || []) {
                await this.addComponentWithRetry(nodeUuid, component.type, plan.rootDbUrl, deadline);
            }
        }

        const componentIds = new Map<string, string>();
        for (const spec of plan.blueprint.nodes as NodeSpec[]) {
            const nodeUuid = nodeIds.get(spec.id)!;
            const result = await this.components.execute('get_components', { nodeUuid });
            for (const component of result.data?.components || []) {
                if (component.uuid) componentIds.set(`${spec.id}:${component.type}`, component.uuid);
            }
        }

        for (const spec of plan.blueprint.nodes as NodeSpec[]) {
            const nodeUuid = nodeIds.get(spec.id)!;
            for (const component of spec.components || []) {
                for (const [property, raw] of Object.entries(component.properties || {})) {
                    const resolved = this.resolveValue(raw, nodeIds, componentIds);
                    const result = await this.components.execute('set_component_property', {
                        nodeUuid,
                        componentType: component.type,
                        property,
                        propertyType: this.propertyType(property, raw),
                        value: resolved
                    });
                    if (!result.success) throw new Error(result.error || `Failed to set ${component.type}.${property}`);
                }
            }
        }

        const saved = await this.scene.execute('save_scene', {});
        if (!saved.success) throw new Error(saved.error || 'Scene save failed');
        const hierarchy = await this.scene.execute('get_scene_hierarchy', { includeComponents: true });
        const sceneAsset = await this.queryAsset(plan.sceneUrl);
        const ready = Boolean(sceneAsset) && hierarchy.success && nodeIds.size === plan.blueprint.nodes.length;
        const serializedNodes = Array.from(nodeIds.entries()).reduce((result, [id, uuid]) => {
            result[id] = uuid;
            return result;
        }, {} as Record<string, string>);
        return {
            success: ready,
            data: {
                phase: ready ? 'complete' : 'verification-failed',
                ...this.publicPlan(plan), files, nodes: serializedNodes,
                hierarchy: hierarchy.data, journal,
                buildHint: { tool: 'project_build', arguments: { platform: 'web-desktop', mode: 'auto', options: { scenes: [plan.sceneUrl] } } }
            },
            ...(ready ? { message: `Playable game created: ${plan.projectName}` } : { error: 'Final verification failed' })
        };
    }

    private async addComponentWithRetry(nodeUuid: string, type: string, rootDbUrl: string, deadline: number): Promise<void> {
        let last = '';
        while (Date.now() <= deadline) {
            const result = await this.components.execute('add_component', { nodeUuid, componentType: type });
            if (result.success) return;
            const listed = await this.components.execute('get_components', { nodeUuid });
            if ((listed.data?.components || []).some((item: any) => item.type === type)) return;
            last = result.error || `Component ${type} unavailable`;
            await Editor.Message.request('asset-db', 'refresh-asset', rootDbUrl).catch(() => undefined);
            await sleep(500);
        }
        throw new Error(`Timed out waiting for component ${type}: ${last}`);
    }

    private writeFiles(plan: any): any {
        const result = { created: [] as string[], updated: [] as string[], skipped: [] as string[] };
        for (const file of plan.blueprint.files as FileSpec[]) {
            const target = this.filePath(plan.rootAbsolute, file.path);
            const relative = path.relative(Editor.Project.path, target).replace(/\\/g, '/');
            const exists = fs.existsSync(target);
            if (exists && !plan.overwrite) { result.skipped.push(relative); continue; }
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, file.content, 'utf8');
            (exists ? result.updated : result.created).push(relative);
        }
        return result;
    }

    private arcadeBlueprint(projectName: string): Blueprint {
        return {
            entryComponent: 'ArcadeClicker',
            files: [
                { path: 'scripts/ArcadeClicker.ts', content: arcadeClickerSource(projectName) },
                { path: 'data/game-blueprint.json', content: `${JSON.stringify({ projectName, template: 'arcade-clicker-2d', entryComponent: 'ArcadeClicker' }, null, 2)}\n` },
                { path: 'README.md', content: `# ${projectName}\n\nAsset-free playable 2D clicker generated by cocos-mcp-server.\n` }
            ],
            nodes: [
                {
                    id: 'canvas', name: 'GameCanvas',
                    components: [
                        { type: 'cc.Canvas', properties: { cameraComponent: { $component: { node: 'camera', type: 'cc.Camera' } } } },
                        { type: 'cc.UITransform', properties: { contentSize: { width: 960, height: 640 } } },
                        { type: 'ArcadeClicker' }
                    ]
                },
                {
                    id: 'camera', name: 'UICamera', parentId: 'canvas', position: { z: 1000 },
                    components: [{ type: 'cc.Camera', properties: { projection: 0, orthoHeight: 320, priority: 1073741824, visibility: 33554432 } }]
                }
            ]
        };
    }

    private customBlueprint(value: any): Blueprint {
        if (!value || typeof value !== 'object') throw new Error('blueprint is required for template=custom');
        return { files: Array.isArray(value.files) ? value.files : [], nodes: Array.isArray(value.nodes) ? value.nodes : [], entryComponent: value.entryComponent };
    }

    private validate(blueprint: Blueprint, root: string): void {
        if (!blueprint.nodes.length || blueprint.nodes.length > 500) throw new Error('blueprint.nodes must contain 1-500 nodes');
        if (blueprint.files.length > 100) throw new Error('blueprint.files cannot exceed 100 files');
        const ids = new Set<string>();
        let bytes = 0;
        for (const file of blueprint.files) {
            this.filePath(root, String(file.path || ''));
            bytes += Buffer.byteLength(String(file.content || ''), 'utf8');
        }
        if (bytes > 5 * 1024 * 1024) throw new Error('blueprint files exceed 5 MB');
        for (const node of blueprint.nodes) {
            if (!node.id || !node.name || ids.has(node.id)) throw new Error(`Invalid or duplicate node id: ${node.id}`);
            if (node.parentId && !ids.has(node.parentId)) throw new Error(`Parent ${node.parentId} must appear before ${node.id}`);
            ids.add(node.id);
        }
    }

    private resolveValue(value: any, nodes: Map<string, string>, components: Map<string, string>): any {
        if (value?.$node) return nodes.get(String(value.$node));
        if (value?.$component) return components.get(`${value.$component.node}:${value.$component.type}`);
        return value;
    }

    private propertyType(property: string, value: any): string | undefined {
        if (value?.$node) return 'node';
        if (value?.$component || property === 'cameraComponent') return 'component';
        if (property === 'contentSize') return 'size';
        return undefined;
    }

    private publicPlan(plan: any): any {
        return {
            template: plan.template,
            projectName: plan.projectName,
            root: path.relative(Editor.Project.path, plan.rootAbsolute).replace(/\\/g, '/'),
            sceneUrl: plan.sceneUrl,
            files: plan.blueprint.files.map((file: FileSpec) => file.path),
            nodes: plan.blueprint.nodes
        };
    }

    private assetRoot(input: string): string {
        const normalized = String(input).replace(/\\/g, '/').replace(/^\.\//, '');
        const relative = normalized === 'assets' || normalized.startsWith('assets/') ? normalized : `assets/${normalized}`;
        const assets = path.resolve(Editor.Project.path, 'assets');
        const target = path.resolve(Editor.Project.path, relative);
        if (target !== assets && !target.startsWith(`${assets}${path.sep}`)) throw new Error('root must stay under assets/');
        return target;
    }

    private filePath(root: string, input: string): string {
        const normalized = String(input).replace(/\\/g, '/').replace(/^\.\//, '');
        if (!normalized || path.isAbsolute(normalized) || normalized.includes('\0')) throw new Error(`Invalid file path: ${input}`);
        const target = path.resolve(root, normalized);
        if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`File escapes project root: ${input}`);
        return target;
    }

    private dbUrl(absolute: string): string {
        const relative = path.relative(path.resolve(Editor.Project.path, 'assets'), absolute).replace(/\\/g, '/');
        return relative && relative !== '.' ? `db://assets/${relative}` : 'db://assets';
    }

    private sceneFolder(input: string, root: string): string {
        const value = String(input).replace(/\\/g, '/').replace(/\/$/, '');
        if (value.startsWith('db://assets')) return value;
        if (value.startsWith('assets/')) return `db://${value}`;
        if (value.includes('..')) throw new Error('sceneFolder must stay under assets/');
        return `${root}/${value}`;
    }

    private name(input: string, field: string): string {
        const value = String(input).trim();
        if (!value || !/^[A-Za-z0-9 _-]+$/.test(value)) throw new Error(`${field} contains unsupported characters`);
        return value;
    }

    private async queryAsset(url: string): Promise<any | null> {
        try { return await Editor.Message.request('asset-db', 'query-asset-info', url) || null; }
        catch { return null; }
    }
}
