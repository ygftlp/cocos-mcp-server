import { CocosAdapter } from './adapters/contracts';
import { selectCocosAdapter } from './adapters/selector';
import { MCPServer } from './mcp-server';
import { normalizeSettingsData, readSettings, saveSettings } from './settings';
import { MCPServerSettings } from './types';
import { ToolManager } from './tools/tool-manager';
import { ToolRegistry } from './tools/tool-registry';

let mcpServer: MCPServer | null = null;
let toolManager: ToolManager;
let toolRegistry: ToolRegistry;
let cocosAdapter: CocosAdapter;

type SettingsInput = Partial<MCPServerSettings> & { debugLog?: boolean };

function getAdapter(): CocosAdapter {
    if (!cocosAdapter) cocosAdapter = selectCocosAdapter();
    return cocosAdapter;
}

function createRegistry(): ToolRegistry {
    return new ToolRegistry(getAdapter());
}

function ensureRegistry(): ToolRegistry {
    if (!toolRegistry) toolRegistry = createRegistry();
    if (!toolManager) toolManager = new ToolManager(toolRegistry);
    return toolRegistry;
}

function normalizeSettings(input: SettingsInput): MCPServerSettings {
    const current = mcpServer ? mcpServer.getSettings() : readSettings();
    const merged: Partial<MCPServerSettings> = { ...current, ...input };
    if (typeof input.enableDebugLog !== 'boolean' && typeof input.debugLog === 'boolean') {
        merged.enableDebugLog = input.debugLog;
    }
    return normalizeSettingsData(merged);
}

function refreshEnabledTools(): void {
    if (!mcpServer || !toolManager) return;
    mcpServer.updateEnabledTools(toolManager.getEnabledTools());
}

export const methods: { [key: string]: (...args: any[]) => any } = {
    openPanel() {
        getAdapter().openPanel('cocos-mcp-server');
    },

    openToolManager() {
        getAdapter().openPanel('cocos-mcp-server');
    },

    async startServer() {
        if (!mcpServer) throw new Error('MCP server is not initialized');
        refreshEnabledTools();
        await mcpServer.start();
        return { ...mcpServer.getStatus(), compatibility: mcpServer.getCompatibilityReport() };
    },

    async stopServer() {
        if (!mcpServer) return { running: false, port: 0, clients: 0 };
        await mcpServer.stop();
        return { ...mcpServer.getStatus(), compatibility: mcpServer.getCompatibilityReport() };
    },

    getServerStatus() {
        const status = mcpServer ? mcpServer.getStatus() : { running: false, port: 0, clients: 0 };
        return {
            ...status,
            settings: mcpServer ? mcpServer.getSettings() : readSettings(),
            compatibility: toolRegistry ? toolRegistry.getCompatibilityReport() : getAdapter().profile
        };
    },

    getCompatibility() {
        return toolRegistry ? toolRegistry.getCompatibilityReport() : getAdapter().profile;
    },

    async runPlaytest(options: any = {}) {
        const registry = ensureRegistry();
        const executor = registry.getExecutors().project;
        if (!executor) throw new Error('Project tool executor is unavailable');
        return executor.execute('playtest', options || {});
    },

    async stopPlaytest() {
        return getAdapter().runtime.stop();
    },

    async updateSettings(settings: SettingsInput) {
        const normalized = normalizeSettings(settings);
        saveSettings(normalized);

        ensureRegistry();

        if (!mcpServer) {
            mcpServer = new MCPServer(normalized, toolRegistry);
            refreshEnabledTools();
            return { success: true, running: false, settings: normalized, compatibility: toolRegistry.getCompatibilityReport() };
        }

        const wasRunning = mcpServer.getStatus().running;
        await mcpServer.updateSettings(normalized);
        refreshEnabledTools();
        return { success: true, running: wasRunning, settings: normalized, compatibility: toolRegistry.getCompatibilityReport() };
    },

    getToolsList() {
        return mcpServer ? mcpServer.getAvailableTools() : [];
    },

    getFilteredToolsList() {
        if (!mcpServer) return [];
        const enabledTools = toolManager.getEnabledTools();
        mcpServer.updateEnabledTools(enabledTools);
        return mcpServer.getFilteredTools(enabledTools);
    },

    async getServerSettings() {
        return mcpServer ? mcpServer.getSettings() : readSettings();
    },

    async getSettings() {
        return mcpServer ? mcpServer.getSettings() : readSettings();
    },

    async getToolManagerState() {
        return toolManager.getToolManagerState();
    },

    async createToolConfiguration(name: string, description?: string) {
        const config = toolManager.createConfiguration(name, description);
        return { success: true, id: config.id, config };
    },

    async updateToolConfiguration(configId: string, updates: any) {
        const config = toolManager.updateConfiguration(configId, updates);
        refreshEnabledTools();
        return config;
    },

    async deleteToolConfiguration(configId: string) {
        toolManager.deleteConfiguration(configId);
        refreshEnabledTools();
        return { success: true };
    },

    async setCurrentToolConfiguration(configId: string) {
        toolManager.setCurrentConfiguration(configId);
        refreshEnabledTools();
        return { success: true };
    },

    async updateToolStatus(category: string, toolName: string, enabled: boolean) {
        const currentConfig = toolManager.getCurrentConfiguration();
        if (!currentConfig) throw new Error('没有当前配置');
        toolManager.updateToolStatus(currentConfig.id, category, toolName, enabled);
        refreshEnabledTools();
        return { success: true };
    },

    async updateToolStatusBatch(updates: any[]) {
        const currentConfig = toolManager.getCurrentConfiguration();
        if (!currentConfig) throw new Error('没有当前配置');
        toolManager.updateToolStatusBatch(currentConfig.id, updates);
        refreshEnabledTools();
        return { success: true };
    },

    async exportToolConfiguration(configId: string) {
        return { configJson: toolManager.exportConfiguration(configId) };
    },

    async importToolConfiguration(configJson: string) {
        const config = toolManager.importConfiguration(configJson);
        refreshEnabledTools();
        return config;
    },

    async getEnabledTools() {
        return toolManager.getEnabledTools();
    }
};

export function load() {
    cocosAdapter = selectCocosAdapter();
    console.log(`Cocos MCP Server extension loaded with ${cocosAdapter.profile.adapterId} (${cocosAdapter.profile.supportLevel})`);
    toolRegistry = createRegistry();
    toolManager = new ToolManager(toolRegistry);

    const settings = readSettings();
    mcpServer = new MCPServer(settings, toolRegistry);
    refreshEnabledTools();

    if (settings.autoStart) {
        mcpServer.start().catch((error) => console.error('Failed to auto-start MCP server:', error));
    }
}

export function unload() {
    if (cocosAdapter) {
        void cocosAdapter.runtime.stop().catch((error) => console.error('Failed to stop playtest runtime:', error));
    }
    if (mcpServer) {
        void mcpServer.stop();
        mcpServer = null;
    }
}
