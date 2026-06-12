import { v4 as uuidv4 } from 'uuid';
import { ToolConfig, ToolConfiguration, ToolManagerSettings } from '../types';
import { ToolRegistry } from './tool-registry';
import * as fs from 'fs';
import * as path from 'path';

export class ToolManager {
    private settings: ToolManagerSettings;
    private availableTools: ToolConfig[] = [];
    private registry: ToolRegistry;

    constructor(registry: ToolRegistry) {
        this.registry = registry;
        this.settings = this.readToolManagerSettings();
        this.initializeAvailableTools();
        this.migrateConfigurations();
        
        // 如果没有配置，自动创建一个默认配置
        if (this.settings.configurations.length === 0) {
            console.log('[ToolManager] No configurations found, creating default configuration...');
            this.createConfiguration('默认配置', '自动创建的默认工具配置');
        }
    }

    private getToolManagerSettingsPath(): string {
        return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
    }

    private ensureSettingsDir(): void {
        const settingsDir = path.dirname(this.getToolManagerSettingsPath());
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
    }

    private readToolManagerSettings(): ToolManagerSettings {
        const DEFAULT_TOOL_MANAGER_SETTINGS: ToolManagerSettings = {
            configurations: [],
            currentConfigId: '',
            maxConfigSlots: 5
        };

        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            if (fs.existsSync(settingsFile)) {
                const content = fs.readFileSync(settingsFile, 'utf8');
                return { ...DEFAULT_TOOL_MANAGER_SETTINGS, ...JSON.parse(content) };
            }
        } catch (e) {
            console.error('Failed to read tool manager settings:', e);
        }
        return DEFAULT_TOOL_MANAGER_SETTINGS;
    }

    private saveToolManagerSettings(settings: ToolManagerSettings): void {
        try {
            this.ensureSettingsDir();
            const settingsFile = this.getToolManagerSettingsPath();
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        } catch (e) {
            console.error('Failed to save tool manager settings:', e);
            throw e;
        }
    }

    private exportToolConfiguration(config: ToolConfiguration): string {
        return JSON.stringify(config, null, 2);
    }

    private importToolConfiguration(configJson: string): ToolConfiguration {
        try {
            const config = JSON.parse(configJson);
            // 验证配置格式
            if (!config.id || !config.name || !Array.isArray(config.tools)) {
                throw new Error('Invalid configuration format');
            }
            return config;
        } catch (e) {
            console.error('Failed to parse tool configuration:', e);
            throw new Error('Invalid JSON format or configuration structure');
        }
    }

    // Load available tool configs from the registry, fallback to defaults if empty.


    private initializeAvailableTools(): void {
        this.availableTools = this.registry.listToolConfigs();
        if (this.availableTools.length === 0) {
            this.initializeDefaultTools();
            return;
        }
        console.log(`[ToolManager] Initialized ${this.availableTools.length} tools from registry`);
    }

    // Reconcile stored configurations with current registry tool set.

    private migrateConfigurations(): void {
        if (this.settings.configurations.length === 0) {
            return;
        }

        const availableMap = new Map<string, ToolConfig>();
        this.availableTools.forEach(tool => {
            availableMap.set(`${tool.category}_${tool.name}`, tool);
        });

        let changed = false;
        this.settings.configurations = this.settings.configurations.map(config => {
            const enabledSet = new Set<string>();
            let matched = 0;

            for (const tool of config.tools) {
                const key = `${tool.category}_${tool.name}`;
                if (availableMap.has(key)) {
                    matched++;
                    if (tool.enabled) {
                        enabledSet.add(key);
                    }
                }
            }

            const useEnabledMap = matched > 0;
            const mergedTools = this.availableTools.map(tool => {
                const key = `${tool.category}_${tool.name}`;
                return {
                    ...tool,
                    enabled: useEnabledMap ? enabledSet.has(key) : tool.enabled
                };
            });

            if (matched !== config.tools.length || config.tools.length !== mergedTools.length) {
                changed = true;
            }

            return {
                ...config,
                tools: mergedTools,
                updatedAt: new Date().toISOString()
            };
        });

        if (!this.settings.currentConfigId || !this.settings.configurations.find(c => c.id === this.settings.currentConfigId)) {
            this.settings.currentConfigId = this.settings.configurations[0]?.id || '';
            changed = true;
        }

        if (changed) {
            this.saveSettings();
        }
    }

    // Fallback default tool list for v1.5 core tools.

    private initializeDefaultTools(): void {
        // 默认工具列表作为后备方案（v1.5核心50工具）
        const toolCategories = [
            { category: 'scene', name: '场景工具', tools: [
                { name: 'management', description: '场景管理' },
                { name: 'hierarchy', description: '场景层级' },
                { name: 'execution_control', description: '执行控制' },
                { name: 'snapshot', description: '场景快照' },
                { name: 'query', description: '场景查询' },
                { name: 'undo', description: '撤销记录' }
            ]},
            { category: 'node', name: '节点工具', tools: [
                { name: 'query', description: '节点查询' },
                { name: 'lifecycle', description: '节点生命周期' },
                { name: 'transform', description: '节点变换' },
                { name: 'hierarchy', description: '节点层级' },
                { name: 'clipboard', description: '节点剪贴板' },
                { name: 'property_management', description: '节点属性管理' },
                { name: 'batch', description: '节点批处理' }
            ]},
            { category: 'component', name: '组件工具', tools: [
                { name: 'manage', description: '组件管理' },
                { name: 'script', description: '脚本组件' },
                { name: 'query', description: '组件查询' },
                { name: 'property', description: '组件属性' },
                { name: 'event', description: '组件事件' }
            ]},
            { category: 'prefab', name: '预制体工具', tools: [
                { name: 'browse', description: '预制体浏览' },
                { name: 'lifecycle', description: '预制体生命周期' },
                { name: 'instance', description: '预制体实例' },
                { name: 'edit', description: '预制体编辑' }
            ]},
            { category: 'asset', name: '资源工具', tools: [
                { name: 'manage', description: '资源管理' },
                { name: 'analyze', description: '资源分析' },
                { name: 'system', description: '资源系统' },
                { name: 'query', description: '资源查询' },
                { name: 'operations', description: '资源操作' },
                { name: 'dependency', description: '资源依赖' },
                { name: 'manifest', description: '资源清单' },
                { name: 'compress', description: '资源压缩' }
            ]},
            { category: 'project', name: '项目工具', tools: [
                { name: 'manage', description: '项目管理' },
                { name: 'build_system', description: '构建系统' },
                { name: 'preview', description: '预览服务器' }
            ]},
            { category: 'debug', name: '调试工具', tools: [
                { name: 'console', description: '控制台' },
                { name: 'logs', description: '日志' },
                { name: 'system', description: '系统信息' },
                { name: 'validation', description: '调试验证' }
            ]},
            { category: 'preferences', name: '偏好设置工具', tools: [
                { name: 'manage', description: '偏好管理' },
                { name: 'global', description: '全局偏好' }
            ]},
            { category: 'server', name: '服务器工具', tools: [
                { name: 'info', description: '服务器信息' },
                { name: 'batch', description: '批量调用' }
            ]},
            { category: 'broadcast', name: '广播工具', tools: [
                { name: 'message', description: '广播消息' }
            ]},
            { category: 'sceneView', name: '场景视图工具', tools: [
                { name: 'control', description: '视图控制' },
                { name: 'tools', description: '视图工具' }
            ]},
            { category: 'referenceImage', name: '参考图片工具', tools: [
                { name: 'manage', description: '参考图管理' },
                { name: 'view', description: '参考图视图' }
            ]},
            { category: 'validation', name: '验证工具', tools: [
                { name: 'scene', description: '场景验证' },
                { name: 'asset', description: '资源验证' },
                { name: 'json', description: 'JSON验证' },
                { name: 'request', description: '请求格式' }
            ]}
        ];

        this.availableTools = [];
        toolCategories.forEach(category => {
            category.tools.forEach(tool => {
                this.availableTools.push({
                    category: category.category,
                    name: tool.name,
                    enabled: true, // 默认启用
                    description: tool.description
                });
            });
        });

        console.log(`[ToolManager] Initialized ${this.availableTools.length} default tools`);
    }

    public getAvailableTools(): ToolConfig[] {
        return [...this.availableTools];
    }

    public getConfigurations(): ToolConfiguration[] {
        return [...this.settings.configurations];
    }

    public getCurrentConfiguration(): ToolConfiguration | null {
        if (!this.settings.currentConfigId) {
            return null;
        }
        return this.settings.configurations.find(config => config.id === this.settings.currentConfigId) || null;
    }

    public createConfiguration(name: string, description?: string): ToolConfiguration {
        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }

        const config: ToolConfiguration = {
            id: uuidv4(),
            name,
            description,
            tools: this.availableTools.map(tool => ({ ...tool })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.settings.configurations.push(config);
        this.settings.currentConfigId = config.id;
        this.saveSettings();

        return config;
    }

    public updateConfiguration(configId: string, updates: Partial<ToolConfiguration>): ToolConfiguration {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }

        const config = this.settings.configurations[configIndex];
        const updatedConfig: ToolConfiguration = {
            ...config,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.settings.configurations[configIndex] = updatedConfig;
        this.saveSettings();

        return updatedConfig;
    }

    public deleteConfiguration(configId: string): void {
        const configIndex = this.settings.configurations.findIndex(config => config.id === configId);
        if (configIndex === -1) {
            throw new Error('配置不存在');
        }

        this.settings.configurations.splice(configIndex, 1);
        
        // 如果删除的是当前配置，清空当前配置ID
        if (this.settings.currentConfigId === configId) {
            this.settings.currentConfigId = this.settings.configurations.length > 0 
                ? this.settings.configurations[0].id 
                : '';
        }

        this.saveSettings();
    }

    public setCurrentConfiguration(configId: string): void {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }

        this.settings.currentConfigId = configId;
        this.saveSettings();
    }

    public updateToolStatus(configId: string, category: string, toolName: string, enabled: boolean): void {
        console.log(`Backend: Updating tool status - configId: ${configId}, category: ${category}, toolName: ${toolName}, enabled: ${enabled}`);
        
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            throw new Error('配置不存在');
        }

        console.log(`Backend: Found config: ${config.name}`);

        const tool = config.tools.find(t => t.category === category && t.name === toolName);
        if (!tool) {
            console.error(`Backend: Tool not found - category: ${category}, name: ${toolName}`);
            throw new Error('工具不存在');
        }

        console.log(`Backend: Found tool: ${tool.name}, current enabled: ${tool.enabled}, new enabled: ${enabled}`);
        
        tool.enabled = enabled;
        config.updatedAt = new Date().toISOString();
        
        console.log(`Backend: Tool updated, saving settings...`);
        this.saveSettings();
        console.log(`Backend: Settings saved successfully`);
    }

    public updateToolStatusBatch(configId: string, updates: { category: string; name: string; enabled: boolean }[]): void {
        console.log(`Backend: updateToolStatusBatch called with configId: ${configId}`);
        console.log(`Backend: Current configurations count: ${this.settings.configurations.length}`);
        console.log(`Backend: Current config IDs:`, this.settings.configurations.map(c => c.id));
        
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            console.error(`Backend: Config not found with ID: ${configId}`);
            console.error(`Backend: Available config IDs:`, this.settings.configurations.map(c => c.id));
            throw new Error('配置不存在');
        }

        console.log(`Backend: Found config: ${config.name}, updating ${updates.length} tools`);

        updates.forEach(update => {
            const tool = config.tools.find(t => t.category === update.category && t.name === update.name);
            if (tool) {
                tool.enabled = update.enabled;
            }
        });

        config.updatedAt = new Date().toISOString();
        this.saveSettings();
        console.log(`Backend: Batch update completed successfully`);
    }

    public exportConfiguration(configId: string): string {
        const config = this.settings.configurations.find(config => config.id === configId);
        if (!config) {
            throw new Error('配置不存在');
        }

        return this.exportToolConfiguration(config);
    }

    public importConfiguration(configJson: string): ToolConfiguration {
        const config = this.importToolConfiguration(configJson);
        
        // 生成新的ID和时间戳
        config.id = uuidv4();
        config.createdAt = new Date().toISOString();
        config.updatedAt = new Date().toISOString();

        if (this.settings.configurations.length >= this.settings.maxConfigSlots) {
            throw new Error(`已达到最大配置槽位数量 (${this.settings.maxConfigSlots})`);
        }

        this.settings.configurations.push(config);
        this.saveSettings();

        return config;
    }

    public getEnabledTools(): ToolConfig[] {
        const currentConfig = this.getCurrentConfiguration();
        if (!currentConfig) {
            return this.availableTools.filter(tool => tool.enabled);
        }
        return currentConfig.tools.filter(tool => tool.enabled);
    }

    public getToolManagerState() {
        const currentConfig = this.getCurrentConfiguration();
        return {
            success: true,
            availableTools: currentConfig ? currentConfig.tools : this.getAvailableTools(),
            selectedConfigId: this.settings.currentConfigId,
            configurations: this.getConfigurations(),
            maxConfigSlots: this.settings.maxConfigSlots
        };
    }

    private saveSettings(): void {
        console.log(`Backend: Saving settings, current configs count: ${this.settings.configurations.length}`);
        this.saveToolManagerSettings(this.settings);
        console.log(`Backend: Settings saved to file`);
    }
} 
