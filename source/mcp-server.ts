import * as crypto from 'crypto';
import * as http from 'http';
import * as url from 'url';
import { MCPServerSettings, ServerStatus, MCPClient, ToolDefinition } from './types';
import { ToolRegistry, ToolHandler } from './tools/tool-registry';
import { formatToolsForProvider, ModelToolProvider } from './compat/model-tool-formats';
import { MCPProtocolEngine, LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from './mcp-protocol';

export class MCPServer {
    private httpServer: http.Server | null = null;
    private clients = new Map<string, MCPClient>();
    private toolsList: ToolDefinition[] = [];
    private enabledTools: any[] = [];
    private toolHandlers = new Map<string, ToolHandler>();
    private simplifiedToolsCache: any[] | null = null;
    private activeRequests = 0;
    private readonly maxRequestBodyBytes = 1024 * 1024;
    private readonly protocol: MCPProtocolEngine;

    constructor(private settings: MCPServerSettings, private registry: ToolRegistry) {
        this.setupTools();
        this.registry.setToolCallExecutor(this.executeToolCall.bind(this));
        this.protocol = new MCPProtocolEngine(
            () => this.toolsList,
            (name, args) => this.executeToolCall(name, args),
            '1.4.0'
        );
    }

    async start(): Promise<void> {
        if (this.httpServer) return;
        const bindAddress = this.settings.bindAddress || '127.0.0.1';
        this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
        await new Promise<void>((resolve, reject) => {
            this.httpServer!.listen(this.settings.port, bindAddress, resolve);
            this.httpServer!.once('error', reject);
        });
        this.setupTools();
        console.log(`[MCPServer] HTTP server: http://${bindAddress}:${this.settings.port}/mcp`);
    }

    async stop(): Promise<void> {
        if (this.httpServer) {
            const server = this.httpServer;
            this.httpServer = null;
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
        this.clients.clear();
    }

    async updateSettings(settings: MCPServerSettings): Promise<void> {
        this.settings = settings;
        this.simplifiedToolsCache = null;
        if (this.httpServer) {
            await this.stop();
            await this.start();
        }
    }

    getStatus(): ServerStatus {
        return { running: Boolean(this.httpServer), port: this.settings.port, clients: this.clients.size };
    }

    getClients(): MCPClient[] { return Array.from(this.clients.values()); }
    getAvailableTools(): ToolDefinition[] { return this.toolsList; }
    getSettings(): MCPServerSettings { return this.settings; }

    getFilteredTools(enabledTools: any[]): ToolDefinition[] {
        if (!enabledTools?.length) return this.toolsList;
        const names = new Set(enabledTools.map((tool) => `${tool.category}_${tool.name}`));
        return this.toolsList.filter((tool) => names.has(tool.name));
    }

    updateEnabledTools(enabledTools: any[]): void {
        this.enabledTools = enabledTools || [];
        this.setupTools();
    }

    async executeToolCall(toolName: string, args: any): Promise<any> {
        const handler = this.toolHandlers.get(toolName);
        if (!handler) throw new Error(`Tool ${toolName} not found or disabled`);
        return handler.executor.execute(handler.method, args || {});
    }

    private setupTools(): void {
        const runtime = this.registry.buildRuntime(this.enabledTools);
        this.toolsList = runtime.toolsList;
        this.toolHandlers = runtime.toolHandlers;
        this.simplifiedToolsCache = null;
    }

    private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const pathname = url.parse(req.url || '', true).pathname || '/';
        if (!this.applyCorsHeaders(req, res)) return this.sendJson(res, 403, { error: 'Origin not allowed' });
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

        if (pathname === '/health' && req.method === 'GET') {
            return this.sendJson(res, 200, {
                status: 'ok', tools: this.toolsList.length,
                protocolVersion: LATEST_PROTOCOL_VERSION,
                supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS
            });
        }
        if (!this.isAuthorized(req)) {
            res.setHeader('WWW-Authenticate', 'Bearer realm="cocos-mcp-server"');
            return this.sendJson(res, 401, { error: 'Unauthorized' });
        }
        if (this.settings.maxConnections > 0 && this.activeRequests >= this.settings.maxConnections) {
            return this.sendJson(res, 503, { error: 'Server busy, try again later' });
        }

        this.activeRequests++;
        let finalized = false;
        const finalize = () => {
            if (finalized) return;
            finalized = true;
            this.activeRequests = Math.max(0, this.activeRequests - 1);
        };
        res.once('finish', finalize);
        res.once('close', finalize);

        try {
            if (pathname === '/mcp') return await this.handleMcp(req, res);
            if (pathname === '/manifest' && req.method === 'GET') return this.sendJson(res, 200, this.manifest());

            const provider = this.resolveProvider(pathname);
            if (provider && req.method === 'GET') {
                return this.sendJson(res, 200, { provider, tools: formatToolsForProvider(provider, this.toolsList) });
            }
            if (pathname === '/v1/tools/call' && req.method === 'POST') return await this.handleUniversalCall(req, res);
            if (pathname === '/api/tools' && req.method === 'GET') return this.sendJson(res, 200, { tools: this.getSimplifiedTools() });
            if (pathname.startsWith('/api/') && req.method === 'POST') return await this.handleDirectCall(req, res, pathname);
            return this.sendJson(res, 404, { error: 'Not found' });
        } catch (error: any) {
            if (!res.headersSent) {
                const status = error?.code === 'ERR_BODY_TOO_LARGE' ? 413 : 500;
                this.sendJson(res, status, { error: error?.message || String(error) });
            } else res.end();
        }
    }

    private async handleMcp(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const requested = this.protocolVersion(req);
        if (requested && !SUPPORTED_PROTOCOL_VERSIONS.includes(requested)) {
            return this.sendJson(res, 400, { error: `Unsupported MCP protocol version: ${requested}`, supportedProtocolVersions: SUPPORTED_PROTOCOL_VERSIONS });
        }
        res.setHeader('MCP-Protocol-Version', requested || LATEST_PROTOCOL_VERSION);

        if (req.method === 'GET') {
            res.setHeader('Allow', 'POST, DELETE');
            return this.sendJson(res, 405, { error: 'This stateless server does not open a server-initiated SSE stream. Use POST /mcp.' });
        }
        if (req.method === 'DELETE') { res.writeHead(204); res.end(); return; }
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST, DELETE');
            return this.sendJson(res, 405, { error: 'Method not allowed' });
        }

        let payload: any;
        try {
            payload = JSON.parse(await this.readBody(req));
        } catch (error: any) {
            return this.sendJson(res, 400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: `Parse error: ${error.message}` } });
        }
        const response = await this.protocol.handlePayload(payload);
        if (response === null) { res.writeHead(202); res.end(); return; }
        this.sendJson(res, 200, response);
    }

    private async handleUniversalCall(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const payload = JSON.parse(await this.readBody(req));
        const functionPayload = payload?.function || payload;
        const name = functionPayload?.name;
        let args = functionPayload?.arguments ?? functionPayload?.input ?? {};
        if (typeof args === 'string') args = JSON.parse(args);
        if (typeof name !== 'string' || !name) return this.sendJson(res, 400, { error: 'Tool name is required' });
        const result = await this.protocol.callTool(name, args);
        this.sendJson(res, result.ok === false ? 400 : 200, result);
    }

    private async handleDirectCall(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<void> {
        const parts = pathname.split('/').filter(Boolean);
        if (parts.length < 3) return this.sendJson(res, 400, { error: 'Use /api/{category}/{tool_name}' });
        const name = `${parts[1]}_${parts.slice(2).join('_')}`;
        const body = await this.readBody(req);
        const result = await this.protocol.callTool(name, body.trim() ? JSON.parse(body) : {});
        this.sendJson(res, result.ok === false ? 400 : 200, { success: result.ok !== false, tool: name, result });
    }

    private manifest(): any {
        const base = `http://127.0.0.1:${this.settings.port}`;
        return {
            name: 'cocos-mcp-server', version: '1.4.0',
            mcp: { transport: 'streamable-http', endpoint: `${base}/mcp`, protocolVersions: SUPPORTED_PROTOCOL_VERSIONS },
            toolFormats: {
                openaiResponses: `${base}/v1/tools/openai/responses`,
                openaiChatCompletions: `${base}/v1/tools/openai/chat`,
                anthropic: `${base}/v1/tools/anthropic`,
                gemini: `${base}/v1/tools/gemini`
            },
            callEndpoint: `${base}/v1/tools/call`,
            authentication: this.settings.authToken ? 'bearer' : 'none'
        };
    }

    private resolveProvider(pathname: string): ModelToolProvider | null {
        const providers: Record<string, ModelToolProvider> = {
            '/v1/tools/openai/responses': 'openai-responses',
            '/v1/tools/openai/chat': 'openai-chat',
            '/v1/tools/anthropic': 'anthropic',
            '/v1/tools/gemini': 'gemini'
        };
        return providers[pathname] || null;
    }

    private getSimplifiedTools(): any[] {
        if (this.simplifiedToolsCache) return this.simplifiedToolsCache;
        this.simplifiedToolsCache = this.toolsList.map((tool) => {
            const parts = tool.name.split('_');
            const category = parts.shift() || '';
            const toolName = parts.join('_');
            return { name: tool.name, category, toolName, description: tool.description, inputSchema: tool.inputSchema, apiPath: `/api/${category}/${toolName}`, xCocos: tool.xCocos };
        });
        return this.simplifiedToolsCache;
    }

    private applyCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse): boolean {
        const allowed = this.settings.allowedOrigins?.length ? this.settings.allowedOrigins : ['*'];
        const origin = req.headers.origin as string | undefined;
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID');
        res.setHeader('Access-Control-Expose-Headers', 'MCP-Protocol-Version, Mcp-Session-Id');
        if (allowed.includes('*')) { res.setHeader('Access-Control-Allow-Origin', '*'); return true; }
        if (origin && allowed.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); return true; }
        return !origin;
    }

    private isAuthorized(req: http.IncomingMessage): boolean {
        const expected = this.settings.authToken;
        if (!expected) return true;
        const header = req.headers.authorization || '';
        const actual = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!actual) return false;
        const expectedBuffer = Buffer.from(expected);
        const actualBuffer = Buffer.from(actual);
        return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    }

    private protocolVersion(req: http.IncomingMessage): string | undefined {
        const header = req.headers['mcp-protocol-version'];
        return Array.isArray(header) ? header[0] : header;
    }

    private readBody(req: http.IncomingMessage): Promise<string> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            let bytes = 0;
            req.on('data', (chunk: Buffer | string) => {
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
                bytes += buffer.length;
                if (bytes > this.maxRequestBodyBytes) {
                    const error: any = new Error('Request body too large');
                    error.code = 'ERR_BODY_TOO_LARGE';
                    reject(error);
                    req.destroy();
                    return;
                }
                chunks.push(buffer);
            });
            req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            req.on('error', reject);
        });
    }

    private sendJson(res: http.ServerResponse, status: number, payload: any): void {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.writeHead(status);
        }
        res.end(JSON.stringify(payload));
    }
}
