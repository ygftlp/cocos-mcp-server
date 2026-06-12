import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { MCPServerSettings, ToolManagerSettings, ToolConfiguration } from './types';

const DEFAULT_SETTINGS: MCPServerSettings = {
    port: 3000,
    autoStart: false,
    enableDebugLog: false,
    // A non-matching sentinel prevents the legacy HTTP layer from treating an empty list as wildcard.
    // CLI/native MCP clients normally send no Origin header and remain supported.
    allowedOrigins: ['http://127.0.0.1:0'],
    maxConnections: 10,
    bindAddress: '127.0.0.1',
    authToken: ''
};

const DEFAULT_TOOL_MANAGER_SETTINGS: ToolManagerSettings = {
    configurations: [],
    currentConfigId: '',
    maxConfigSlots: 5
};

function getSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'mcp-server.json');
}

function getToolManagerSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'tool-manager.json');
}

function ensureSettingsDir(): void {
    const settingsDir = path.dirname(getSettingsPath());
    if (!fs.existsSync(settingsDir)) fs.mkdirSync(settingsDir, { recursive: true });
}

export function generateAuthToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function normalizeSettingsData(input: Partial<MCPServerSettings> = {}): MCPServerSettings {
    const port = Number(input.port);
    const maxConnections = Number(input.maxConnections);
    const allowedOrigins = Array.isArray(input.allowedOrigins)
        ? input.allowedOrigins.filter((origin): origin is string => typeof origin === 'string' && origin.trim().length > 0)
        : [...DEFAULT_SETTINGS.allowedOrigins];
    const authToken = typeof input.authToken === 'string' && input.authToken.trim()
        ? input.authToken.trim()
        : generateAuthToken();

    return {
        port: Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_SETTINGS.port,
        autoStart: Boolean(input.autoStart),
        enableDebugLog: Boolean(input.enableDebugLog),
        allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [...DEFAULT_SETTINGS.allowedOrigins],
        maxConnections: Number.isInteger(maxConnections) && maxConnections >= 0 ? maxConnections : DEFAULT_SETTINGS.maxConnections,
        bindAddress: typeof input.bindAddress === 'string' && input.bindAddress.trim()
            ? input.bindAddress.trim()
            : DEFAULT_SETTINGS.bindAddress,
        authToken
    };
}

export function readSettings(): MCPServerSettings {
    try {
        ensureSettingsDir();
        const settingsFile = getSettingsPath();
        const stored = fs.existsSync(settingsFile)
            ? JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
            : {};
        const settings = normalizeSettingsData({ ...DEFAULT_SETTINGS, ...stored });

        // Persist generated tokens and newly introduced safe defaults once, so clients can read a stable token.
        if (!fs.existsSync(settingsFile) || JSON.stringify(stored) !== JSON.stringify(settings)) {
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
        }
        return settings;
    } catch (error) {
        console.error('Failed to read settings:', error);
        const fallback = normalizeSettingsData(DEFAULT_SETTINGS);
        try {
            ensureSettingsDir();
            fs.writeFileSync(getSettingsPath(), JSON.stringify(fallback, null, 2));
        } catch (writeError) {
            console.error('Failed to persist fallback settings:', writeError);
        }
        return fallback;
    }
}

export function saveSettings(settings: MCPServerSettings): void {
    try {
        ensureSettingsDir();
        const normalized = normalizeSettingsData(settings);
        fs.writeFileSync(getSettingsPath(), JSON.stringify(normalized, null, 2));
    } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
    }
}

export function readToolManagerSettings(): ToolManagerSettings {
    try {
        ensureSettingsDir();
        const settingsFile = getToolManagerSettingsPath();
        if (fs.existsSync(settingsFile)) {
            const content = fs.readFileSync(settingsFile, 'utf8');
            return { ...DEFAULT_TOOL_MANAGER_SETTINGS, ...JSON.parse(content) };
        }
    } catch (error) {
        console.error('Failed to read tool manager settings:', error);
    }
    return { ...DEFAULT_TOOL_MANAGER_SETTINGS };
}

export function saveToolManagerSettings(settings: ToolManagerSettings): void {
    try {
        ensureSettingsDir();
        fs.writeFileSync(getToolManagerSettingsPath(), JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Failed to save tool manager settings:', error);
        throw error;
    }
}

export function exportToolConfiguration(config: ToolConfiguration): string {
    return JSON.stringify(config, null, 2);
}

export function importToolConfiguration(configJson: string): ToolConfiguration {
    try {
        const config = JSON.parse(configJson);
        if (!config.id || !config.name || !Array.isArray(config.tools)) {
            throw new Error('Invalid configuration format');
        }
        return config;
    } catch (error) {
        console.error('Failed to parse tool configuration:', error);
        throw new Error('Invalid JSON format or configuration structure');
    }
}

export { DEFAULT_SETTINGS, DEFAULT_TOOL_MANAGER_SETTINGS };
