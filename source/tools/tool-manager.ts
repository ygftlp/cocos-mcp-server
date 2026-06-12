import { v4 as uuidv4 } from 'uuid';
import { ToolConfig, ToolConfiguration, ToolManagerSettings } from '../types';
import {
    exportToolConfiguration,
    importToolConfiguration,
    readToolManagerSettings,
    saveToolManagerSettings
} from '../settings';
import { ToolRegistry } from './tool-registry';

export function reconcileTools(stored: ToolConfig[] | undefined, available: ToolConfig[]): ToolConfig[] {
    const storedMap = new Map<string, ToolConfig>();
    for (const tool of stored || []) storedMap.set(`${tool.category}_${tool.name}`, tool);

    return available.map((tool) => {
        const previous = storedMap.get(`${tool.category}_${tool.name}`);
        return {
            ...tool,
            // Preserve explicit choices for existing tools; newly introduced tools use the registry default.
            enabled: previous ? Boolean(previous.enabled) : Boolean(tool.enabled)
        };
    });
}

export class ToolManager {
    private settings: ToolManagerSettings;
    private availableTools: ToolConfig[];

    constructor(private readonly registry: ToolRegistry) {
        this.settings = readToolManagerSettings();
        this.availableTools = registry.listToolConfigs();
        this.migrateConfigurations();

        if (this.settings.configurations.length === 0) {
            this.createConfiguration('默认配置', '自动创建的默认工具配置');
        }
    }

    private migrateConfigurations(): void {
        const before = JSON.stringify(this.settings);
        this.settings.configurations = this.settings.configurations.map((config) => ({
            ...config,
            tools: reconcileTools(config.tools, this.availableTools),
            updatedAt: config.updatedAt || new Date().toISOString()
        }));

        if (!this.settings.currentConfigId || !this.settings.configurations.some((config) => config.id === this.settings.currentConfigId)) {
            this.settings.currentConfigId = this.settings.configurations[0]?.id || '';
        }

        if (JSON.stringify(this.settings) !== before) this.saveSettings();
    }

    public getAvailableTools(): ToolConfig[] {
        return this.availableTools.map((tool) => ({ ...tool }));
    }

    public getConfigurations(): ToolConfiguration[] {
        return this.settings.configurations.map((config) => ({
            ...config,
            tools: config.tools.map((tool) => ({ ...tool }))
        }));
    }

    public getCurrentConfiguration(): ToolConfiguration | null {
        return this.settings.configurations.find((config) => config.id === this.settings.currentConfigId) || null;
    }

    public createConfiguration(name: string, description?: string): ToolConfiguration {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }
        if (!name || !name.trim()) throw new Error('配置名称不能为空');

        const now = new Date().toISOString();
        const config: ToolConfiguration = {
            id: uuidv4(),
            name: name.trim(),
            description,
            tools: this.availableTools.map((tool) => ({ ...tool })),
            createdAt: now,
            updatedAt: now
        };
        this.settings.configurations.push(config);
        this.settings.currentConfigId = config.id;
        this.saveSettings();
        return config;
    }

    public updateConfiguration(configId: string, updates: Partial<ToolConfiguration>): ToolConfiguration {
        const index = this.settings.configurations.findIndex((config) => config.id === configId);
        if (index < 0) throw new Error('配置不存在');

        const current = this.settings.configurations[index];
        const updated: ToolConfiguration = {
            ...current,
            ...updates,
            id: current.id,
            createdAt: current.createdAt,
            tools: updates.tools ? reconcileTools(updates.tools, this.availableTools) : current.tools,
            updatedAt: new Date().toISOString()
        };
        this.settings.configurations[index] = updated;
        this.saveSettings();
        return updated;
    }

    public deleteConfiguration(configId: string): void {
        const index = this.settings.configurations.findIndex((config) => config.id === configId);
        if (index < 0) throw new Error('配置不存在');

        this.settings.configurations.splice(index, 1);
        if (this.settings.currentConfigId === configId) {
            this.settings.currentConfigId = this.settings.configurations[0]?.id || '';
        }
        this.saveSettings();
    }

    public setCurrentConfiguration(configId: string): void {
        if (!this.settings.configurations.some((config) => config.id === configId)) throw new Error('配置不存在');
        this.settings.currentConfigId = configId;
        this.saveSettings();
    }

    public updateToolStatus(configId: string, category: string, toolName: string, enabled: boolean): void {
        const config = this.settings.configurations.find((item) => item.id === configId);
        if (!config) throw new Error('配置不存在');
        const tool = config.tools.find((item) => item.category === category && item.name === toolName);
        if (!tool) throw new Error('工具不存在');

        tool.enabled = Boolean(enabled);
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
    }

    public updateToolStatusBatch(configId: string, updates: { category: string; name: string; enabled: boolean }[]): void {
        const config = this.settings.configurations.find((item) => item.id === configId);
        if (!config) throw new Error('配置不存在');
        if (!Array.isArray(updates)) throw new Error('updates 必须是数组');

        const updateMap = new Map(updates.map((update) => [`${update.category}_${update.name}`, Boolean(update.enabled)]));
        for (const tool of config.tools) {
            const enabled = updateMap.get(`${tool.category}_${tool.name}`);
            if (enabled !== undefined) tool.enabled = enabled;
        }
        config.updatedAt = new Date().toISOString();
        this.saveSettings();
    }

    public exportConfiguration(configId: string): string {
        const config = this.settings.configurations.find((item) => item.id === configId);
        if (!config) throw new Error('配置不存在');
        return exportToolConfiguration(config);
    }

    public importConfiguration(configJson: string): ToolConfiguration {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }

        const imported = importToolConfiguration(configJson);
        const now = new Date().toISOString();
        const config: ToolConfiguration = {
            ...imported,
            id: uuidv4(),
            tools: reconcileTools(imported.tools, this.availableTools),
            createdAt: now,
            updatedAt: now
        };
        this.settings.configurations.push(config);
        this.saveSettings();
        return config;
    }

    public getEnabledTools(): ToolConfig[] {
        const current = this.getCurrentConfiguration();
        const source = current ? current.tools : this.availableTools;
        return source.filter((tool) => tool.enabled).map((tool) => ({ ...tool }));
    }

    public getToolManagerState() {
        const current = this.getCurrentConfiguration();
        return {
            success: true,
            availableTools: (current ? current.tools : this.availableTools).map((tool) => ({ ...tool })),
            selectedConfigId: this.settings.currentConfigId,
            configurations: this.getConfigurations(),
            maxConfigSlots: this.settings.maxConfigSlots
        };
    }

    private saveSettings(): void {
        saveToolManagerSettings(this.settings);
    }
}
