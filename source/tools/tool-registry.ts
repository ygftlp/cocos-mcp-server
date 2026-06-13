// Central registry for v1.5 core tool categories and runtime wiring.
import { ToolDefinition, ToolExecutor, ToolConfig, ToolMeta } from '../types';
import { SceneCoreTools } from './core-scene-tools';
import { NodeCoreTools } from './core-node-tools';
import { ComponentCoreTools } from './core-component-tools';
import { PrefabCoreTools } from './core-prefab-tools';
import { AssetCoreTools } from './core-asset-tools';
import { ProjectCoreTools } from './core-project-tools';
import { DebugCoreTools } from './core-debug-tools';
import { PreferencesCoreTools } from './core-preferences-tools';
import { ServerCoreTools } from './core-server-tools';
import { ReferenceImageCoreTools } from './core-reference-image-tools';
import { SceneViewCoreTools } from './core-scene-view-tools';
import { ValidationCoreTools } from './core-validation-tools';
import { UICoreTools } from './core-ui-tools';
import { ServerTools } from './server-tools';

export type ToolHandler = { executor: ToolExecutor; method: string };
export type ToolCallExecutor = (toolName: string, args: any) => Promise<any>;

export class ToolRegistry {
    private executors: Record<string, ToolExecutor>;
    private toolDefinitionsByCategory: Map<string, ToolDefinition[]> | null = null;
    private toolCallExecutor: ToolCallExecutor | null = null;

    constructor() {
        const serverTools = new ServerTools({
            executeToolCall: (name, args) => this.executeToolCall(name, args),
            invalidateCaches: (scope) => this.invalidateCaches(scope)
        });

        this.executors = {
            scene: new SceneCoreTools(),
            node: new NodeCoreTools(),
            component: new ComponentCoreTools(),
            ui: new UICoreTools(),
            prefab: new PrefabCoreTools(),
            asset: new AssetCoreTools(),
            project: new ProjectCoreTools(),
            debug: new DebugCoreTools(),
            preferences: new PreferencesCoreTools(),
            server: new ServerCoreTools(serverTools),
            referenceImage: new ReferenceImageCoreTools(),
            sceneView: new SceneViewCoreTools(),
            validation: new ValidationCoreTools()
        };
    }

    public getExecutors(): Record<string, ToolExecutor> {
        return this.executors;
    }

    public listToolConfigs(): ToolConfig[] {
        const configs: ToolConfig[] = [];
        for (const [category, tools] of this.getToolDefinitionsByCategory()) {
            for (const tool of tools) {
                configs.push({
                    category,
                    name: tool.name,
                    enabled: true,
                    description: tool.description
                });
            }
        }
        return configs;
    }

    // undefined means no user filter (all tools); [] means the user explicitly disabled every tool.
    public buildRuntime(enabledTools?: ToolConfig[]): { toolsList: ToolDefinition[]; toolHandlers: Map<string, ToolHandler> } {
        const toolsList: ToolDefinition[] = [];
        const toolHandlers = new Map<string, ToolHandler>();
        const enabledSet = Array.isArray(enabledTools)
            ? new Set(enabledTools.map((tool) => `${tool.category}_${tool.name}`))
            : null;

        for (const [category, tools] of this.getToolDefinitionsByCategory()) {
            const executor = this.executors[category];
            for (const tool of tools) {
                const fullName = `${category}_${tool.name}`;
                if (enabledSet !== null && !enabledSet.has(fullName)) continue;

                toolsList.push({
                    ...tool,
                    name: fullName,
                    xCocos: tool.xCocos ?? this.buildToolMeta(category, tool.name)
                });
                toolHandlers.set(fullName, { executor, method: tool.name });
            }
        }

        return { toolsList, toolHandlers };
    }

    private getToolDefinitionsByCategory(): Map<string, ToolDefinition[]> {
        if (this.toolDefinitionsByCategory) return this.toolDefinitionsByCategory;

        const definitions = new Map<string, ToolDefinition[]>();
        for (const [category, executor] of Object.entries(this.executors)) {
            definitions.set(category, executor.getTools());
        }
        this.toolDefinitionsByCategory = definitions;
        return definitions;
    }

    public setToolCallExecutor(executor: ToolCallExecutor): void {
        this.toolCallExecutor = executor;
    }

    private async executeToolCall(toolName: string, args: any): Promise<any> {
        if (!this.toolCallExecutor) throw new Error('Tool executor not initialized');
        return this.toolCallExecutor(toolName, args);
    }

    public invalidateCaches(scope?: string): number {
        let cleared = 0;
        const normalized = (scope || 'all').toLowerCase();

        for (const [category, executor] of Object.entries(this.executors)) {
            if (!this.shouldClearCacheForScope(category, normalized)) continue;
            const candidate = executor as any;
            if (typeof candidate.clearCache === 'function') {
                candidate.clearCache();
                cleared++;
            }
        }
        return cleared;
    }

    private shouldClearCacheForScope(category: string, scope: string): boolean {
        if (scope === 'all') return true;
        if (scope === 'nodes' || scope === 'scene') {
            return category === 'node' || category === 'scene' || category === 'ui' || category === 'prefab';
        }
        if (scope === 'assets' || scope === 'project') {
            return category === 'project' || category === 'asset' || category === 'prefab';
        }
        return false;
    }

    private buildToolMeta(category: string, toolName: string): ToolMeta {
        const name = toolName.toLowerCase();
        const full = `${category}_${name}`;
        const readVerbs = ['get', 'list', 'query', 'find', 'check', 'validate', 'analyze', 'detect'];
        const writeVerbs = ['set', 'update', 'create', 'delete', 'remove', 'add', 'attach', 'move', 'copy', 'import', 'reimport', 'save', 'apply', 'reset', 'start', 'stop', 'build', 'run', 'open'];
        const readHints = ['info', 'status', 'hierarchy', 'browse', 'logs', 'log', 'view', 'catalog'];
        const writeHints = ['manage', 'lifecycle', 'transform', 'operations', 'system', 'snapshot', 'undo', 'batch', 'clipboard', 'edit', 'manifest', 'property', 'control', 'element', 'event'];
        const destructiveVerbs = ['delete', 'remove', 'move', 'reimport', 'reset'];

        const isRead = readVerbs.some((verb) => name.startsWith(verb) || name.includes(`_${verb}`) || full.includes(verb))
            || readHints.some((hint) => name.includes(hint) || full.includes(hint));
        const isWrite = writeVerbs.some((verb) => name.startsWith(verb) || name.includes(`_${verb}`) || full.includes(verb))
            || writeHints.some((hint) => name.includes(hint) || full.includes(hint));
        const destructive = destructiveVerbs.some((verb) => name.startsWith(verb) || name.includes(`_${verb}`));

        let cost: ToolMeta['cost'] = 'medium';
        if (name.includes('build') || name.includes('analyze') || name.includes('validate') || name.includes('optimize')) cost = 'high';
        else if (name.includes('query') || name.includes('get') || name.includes('find') || name.includes('catalog')) cost = 'low';

        let scope: string[];
        if (['scene', 'node', 'component', 'ui', 'prefab', 'sceneView', 'referenceImage'].includes(category)) scope = ['scene'];
        else if (['project', 'asset', 'preferences'].includes(category)) scope = ['project', 'assets'];
        else if (['server', 'debug'].includes(category)) scope = ['system'];
        else scope = ['general'];

        return {
            kind: isWrite && !isRead ? 'write' : 'read',
            destructive,
            sideEffect: isWrite || destructive,
            cost,
            scope
        };
    }
}
