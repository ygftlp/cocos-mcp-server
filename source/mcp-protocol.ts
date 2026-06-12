import { ToolDefinition, ToolMeta } from './types';

export const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
export const LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0];

export type ToolCallExecutor = (name: string, args: any) => Promise<any>;

export class MCPProtocolEngine {
    constructor(
        private readonly getTools: () => ToolDefinition[],
        private readonly executeTool: ToolCallExecutor,
        private readonly serverVersion: string = '1.4.0'
    ) {}

    async handlePayload(payload: any): Promise<any | null> {
        if (Array.isArray(payload)) {
            if (payload.length === 0) return this.invalidRequest(null);
            const responses: any[] = [];
            for (const message of payload) {
                const response = await this.handleMessage(message);
                if (response !== null) responses.push(response);
            }
            return responses.length > 0 ? responses : null;
        }
        if (!payload || typeof payload !== 'object') return this.invalidRequest(null);
        return this.handleMessage(payload);
    }

    async callTool(name: string, args: any): Promise<any> {
        const startedAt = Date.now();
        try {
            const raw = await this.executeTool(name, args || {});
            return this.normalizeToolResult(name, raw, Date.now() - startedAt);
        } catch (error: any) {
            return this.normalizeToolResult(name, {
                success: false,
                ok: false,
                error: error?.message || String(error)
            }, Date.now() - startedAt);
        }
    }

    toCallResult(normalized: any, forceError = false): any {
        const isError = forceError || normalized?.ok === false || normalized?.success === false;
        return {
            content: [{ type: 'text', text: JSON.stringify(normalized) }],
            structuredContent: normalized,
            isError
        };
    }

    private async handleMessage(message: any): Promise<any | null> {
        if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') {
            return this.invalidRequest(message?.id ?? null);
        }
        if (typeof message.method !== 'string') {
            if ('result' in message || 'error' in message) return null;
            return this.invalidRequest(message.id ?? null);
        }

        const { id, method, params } = message;
        const notification = id === undefined || id === null;
        try {
            let result: any;
            switch (method) {
                case 'initialize':
                    result = this.initializeResult(params);
                    break;
                case 'notifications/initialized':
                case 'notifications/cancelled':
                    return null;
                case 'ping':
                    result = {};
                    break;
                case 'tools/list':
                    result = { tools: this.getTools().map((tool) => this.toMcpTool(tool)) };
                    break;
                case 'tools/call': {
                    if (!params || typeof params.name !== 'string') {
                        throw new Error('Invalid params for tools/call: name is required');
                    }
                    const normalized = await this.callTool(params.name, params.arguments || {});
                    result = this.toCallResult(normalized);
                    break;
                }
                case 'resources/list':
                    result = { resources: [] };
                    break;
                case 'prompts/list':
                    result = { prompts: [] };
                    break;
                default:
                    return notification ? null : this.methodNotFound(id, method);
            }
            return notification ? null : { jsonrpc: '2.0', id, result };
        } catch (error: any) {
            if (notification) return null;
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32603, message: error?.message || String(error) }
            };
        }
    }

    private initializeResult(params: any): any {
        const requested = typeof params?.protocolVersion === 'string' ? params.protocolVersion : '';
        const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
            ? requested
            : LATEST_PROTOCOL_VERSION;
        return {
            protocolVersion,
            capabilities: { tools: { listChanged: false } },
            serverInfo: {
                name: 'cocos-mcp-server',
                title: 'Cocos Creator MCP Server',
                version: this.serverVersion
            },
            instructions: 'Use project_quick_start to scaffold a Cocos project, scene/node/component tools to assemble gameplay, and project_build to build it.'
        };
    }

    private toMcpTool(tool: ToolDefinition): any {
        return {
            name: tool.name,
            title: tool.title || tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema || { type: 'object', properties: {} },
            ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
            annotations: this.toAnnotations(tool.xCocos)
        };
    }

    private toAnnotations(meta?: ToolMeta): any {
        if (!meta) return undefined;
        return {
            readOnlyHint: meta.kind === 'read',
            destructiveHint: meta.destructive,
            idempotentHint: meta.kind === 'read',
            openWorldHint: meta.scope.includes('system')
        };
    }

    private normalizeToolResult(toolName: string, raw: any, durationMs: number): any {
        const meta = { tool: toolName, durationMs, timestamp: new Date().toISOString() };
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const result: any = { ...raw };
            const success = typeof result.success === 'boolean' ? result.success : undefined;
            result.ok = typeof result.ok === 'boolean' ? result.ok : (success ?? true);
            result.code = typeof result.code === 'number' ? result.code : (result.ok ? 0 : -1);
            if (!result.summary && typeof result.message === 'string') result.summary = result.message;
            result._meta = { ...meta, ...(result._meta || {}) };
            return result;
        }
        return { success: true, ok: true, code: 0, data: raw, _meta: meta };
    }

    private invalidRequest(id: any): any {
        return { jsonrpc: '2.0', id: id ?? null, error: { code: -32600, message: 'Invalid Request' } };
    }

    private methodNotFound(id: any, method: string): any {
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    }
}
