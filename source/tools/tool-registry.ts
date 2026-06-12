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
import { BroadcastCoreTools } from './core-broadcast-tools';
import { ReferenceImageCoreTools } from './core-reference-image-tools';
import { SceneViewCoreTools } from './core-scene-view-tools';
import { ValidationCoreTools } from './core-validation-tools';
import { ServerTools } from './server-tools';

export type ToolHandler = { executor: ToolExecutor; method: string };
export type ToolCallExecutor = (toolName: string, args: any) => Promise<any>;
export type CacheInvalidator = (scope?: string) => number;

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
            prefab: new PrefabCoreTools(),
            asset: new AssetCoreTools(),
            project: new ProjectCoreTools(),
            debug: new DebugCoreTools(),
            preferences: new PreferencesCoreTools(),
            server: new ServerCoreTools(serverTools),
            broadcast: new BroadcastCoreTools(),
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

    // Build the runtime tool list and handler map based on enabled tool configs.
    public buildRuntime(enabledTools?: ToolConfig[]): { toolsList: ToolDefinition[]; toolHandlers: Map<string, ToolHandler> } {
        const toolsList: ToolDefinition[] = [];
        const toolHandlers: Map<string, ToolHandler> = new Map();

        const enabledSet = enabledTools && enabledTools.length > 0
            ? new Set(enabledTools.map(tool => `${tool.category}_${tool.name}`))
            : null;

        for (const [category, tools] of this.getToolDefinitionsByCategory()) {
            const executor = this.executors[category];
            for (const tool of tools) {
                const fullName = `${category}_${tool.name}`;
                if (enabledSet && !enabledSet.has(fullName)) {
                    continue;
                }
                toolsList.push({
                    name: fullName,
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    xCocos: tool.xCocos ?? this.buildToolMeta(category, tool.name)
                });
                toolHandlers.set(fullName, { executor, method: tool.name });
            }
        }

        return { toolsList, toolHandlers };
    }

    private getToolDefinitionsByCategory(): Map<string, ToolDefinition[]> {
        if (this.toolDefinitionsByCategory) {
            return this.toolDefinitionsByCategory;
        }

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
        if (!this.toolCallExecutor) {
            throw new Error('Tool executor not initialized');
        }
        return this.toolCallExecutor(toolName, args);
    }

    public invalidateCaches(scope?: string): number {
        let cleared = 0;
        const normalized = (scope || 'all').toLowerCase();

        for (const [category, executor] of Object.entries(this.executors)) {
            if (!this.shouldClearCacheForScope(category, normalized)) {
                continue;
            }
            const candidate: any = executor;
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
            return category === 'node' || category === 'scene' || category === 'prefab';
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
        const readHints = ['info', 'status', 'hierarchy', 'browse', 'logs', 'log', 'view'];
        const writeHints = ['manage', 'lifecycle', 'transform', 'operations', 'system', 'preview', 'execution', 'snapshot', 'undo', 'batch', 'clipboard', 'edit', 'compress', 'manifest', 'property', 'event', 'control'];
        const destructiveVerbs = ['delete', 'remove', 'move', 'reimport', 'reset'];

        const isRead = readVerbs.some(v => name.startsWith(v) || name.includes(`_${v}`) || full.includes(v))
            || readHints.some(v => name.includes(v) || full.includes(v));
        const isWrite = writeVerbs.some(v => name.startsWith(v) || name.includes(`_${v}`) || full.includes(v))
            || writeHints.some(v => name.includes(v) || full.includes(v));
        const destructive = destructiveVerbs.some(v => name.startsWith(v) || name.includes(`_${v}`));

        let cost: ToolMeta['cost'] = 'low';
        if (name.includes('build') || name.includes('analyze') || name.includes('validate') || name.includes('optimize')) {
            cost = 'high';
        } else if (name.includes('query') || name.includes('get') || name.includes('find')) {
            cost = 'low';
        } else {
            cost = 'medium';
        }

        let scope: string[] = [];
        if (category === 'scene' || category === 'node' || category === 'component' || category === 'prefab' || category === 'sceneView' || category === 'referenceImage') {
            scope = ['scene'];
        } else if (category === 'project' || category === 'asset' || category === 'preferences') {
            scope = ['project', 'assets'];
        } else if (category === 'server' || category === 'debug' || category === 'broadcast') {
            scope = ['system'];
        } else {
            scope = ['general'];
        }

        const sideEffect = isWrite || destructive;
        const kind: ToolMeta['kind'] = isWrite && !isRead ? 'write' : 'read';

        return {
            kind,
            destructive,
            sideEffect,
            cost,
            scope
        };
    }
}
