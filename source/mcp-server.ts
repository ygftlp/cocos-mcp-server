import * as http from 'http';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { MCPServerSettings, ServerStatus, MCPClient, ToolDefinition } from './types';
import { ToolRegistry, ToolHandler } from './tools/tool-registry';

export class MCPServer {
    private settings: MCPServerSettings;
    private registry: ToolRegistry;
    private httpServer: http.Server | null = null;
    private clients: Map<string, MCPClient> = new Map();
    private toolsList: ToolDefinition[] = [];
    private enabledTools: any[] = []; // 存储启用的工具列表
    private activeRequests = 0;
    private readonly maxRequestBodyBytes = 1024 * 1024; // 1MB 默认限制
    private toolHandlers: Map<string, ToolHandler> = new Map();
    private simplifiedToolsCache: any[] | null = null;

    constructor(settings: MCPServerSettings, registry: ToolRegistry) {
        this.settings = settings;
        this.registry = registry;
        this.setupTools();
        this.registry.setToolCallExecutor(this.executeToolCall.bind(this));
    }

    public async start(): Promise<void> {
        if (this.httpServer) {
            console.log('[MCPServer] Server is already running');
            return;
        }

        try {
            console.log(`[MCPServer] Starting HTTP server on port ${this.settings.port}...`);
            this.httpServer = http.createServer(this.handleHttpRequest.bind(this));

            await new Promise<void>((resolve, reject) => {
                this.httpServer!.listen(this.settings.port, '127.0.0.1', () => {
                    console.log(`[MCPServer] ✅ HTTP server started successfully on http://127.0.0.1:${this.settings.port}`);
                    console.log(`[MCPServer] Health check: http://127.0.0.1:${this.settings.port}/health`);
                    console.log(`[MCPServer] MCP endpoint: http://127.0.0.1:${this.settings.port}/mcp`);
                    resolve();
                });
                this.httpServer!.on('error', (err: any) => {
                    console.error('[MCPServer] ❌ Failed to start server:', err);
                    if (err.code === 'EADDRINUSE') {
                        console.error(`[MCPServer] Port ${this.settings.port} is already in use. Please change the port in settings.`);
                    }
                    reject(err);
                });
            });

            this.setupTools();
            console.log('[MCPServer] 🚀 MCP Server is ready for connections');
        } catch (error) {
            console.error('[MCPServer] ❌ Failed to start server:', error);
            throw error;
        }
    }

    private setupTools(): void {
        this.simplifiedToolsCache = null;
        const runtime = this.registry.buildRuntime(this.enabledTools);
        this.toolsList = runtime.toolsList;
        this.toolHandlers = runtime.toolHandlers;
        
        console.log(`[MCPServer] Setup tools: ${this.toolsList.length} tools available`);
    }

    public getFilteredTools(enabledTools: any[]): ToolDefinition[] {
        if (!enabledTools || enabledTools.length === 0) {
            return this.toolsList; // 如果没有过滤配置，返回所有工具
        }

        const enabledToolNames = new Set(enabledTools.map(tool => `${tool.category}_${tool.name}`));
        return this.toolsList.filter(tool => enabledToolNames.has(tool.name));
    }

    // Enforce enabled-tool routing via registry handler map.


    public async executeToolCall(toolName: string, args: any): Promise<any> {
        const handler = this.toolHandlers.get(toolName);
        if (!handler) {
            throw new Error(`Tool ${toolName} not found or disabled`);
        }
        return await handler.executor.execute(handler.method, args);
    }

    public getClients(): MCPClient[] {
        return Array.from(this.clients.values());
    }
    public getAvailableTools(): ToolDefinition[] {
        return this.toolsList;
    }

    public updateEnabledTools(enabledTools: any[]): void {
        console.log(`[MCPServer] Updating enabled tools: ${enabledTools.length} tools`);
        this.enabledTools = enabledTools;
        this.setupTools(); // 重新设置工具列表
    }

    public getSettings(): MCPServerSettings {
        return this.settings;
    }

    private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;

        // Set CORS headers
        const corsAllowed = this.applyCorsHeaders(req, res);
        res.setHeader('Content-Type', 'application/json');

        if (!corsAllowed) {
            res.writeHead(403);
            res.end(JSON.stringify({ error: 'Origin not allowed' }));
            return;
        }
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Basic concurrent request limit
        if (this.settings.maxConnections > 0 && this.activeRequests >= this.settings.maxConnections) {
            res.writeHead(503);
            res.end(JSON.stringify({ error: 'Server busy, try again later' }));
            return;
        }

        this.activeRequests++;
        let finished = false;
        const finalize = () => {
            if (finished) return;
            finished = true;
            this.activeRequests = Math.max(0, this.activeRequests - 1);
        };
        res.once('finish', finalize);
        res.once('close', finalize);
        
        try {
            this.logDebug(`[MCPServer] ${req.method} ${pathname || ''}`);
            if (pathname === '/mcp' && req.method === 'POST') {
                await this.handleMCPRequest(req, res);
            } else if (pathname === '/health' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok', tools: this.toolsList.length }));
            } else if (pathname?.startsWith('/api/') && req.method === 'POST') {
                await this.handleSimpleAPIRequest(req, res, pathname);
            } else if (pathname === '/api/tools' && req.method === 'GET') {
                res.writeHead(200);
                res.end(JSON.stringify({ tools: this.getSimplifiedToolsList() }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    private async handleMCPRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        try {
            const body = await this.readRequestBody(req, this.maxRequestBodyBytes);
            const payload = this.parseJsonBody(body);
            const response = await this.handleMcpPayload(payload);
            if (response === null) {
                res.writeHead(204);
                res.end();
                return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(response));
        } catch (error: any) {
            if (this.isBodyTooLargeError(error)) {
                res.writeHead(413);
                res.end(JSON.stringify({ error: 'Request body too large' }));
                return;
            }
            console.error('Error handling MCP request:', error);
            res.writeHead(400);
            res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: `Parse error: ${error.message}`
                }
                }));
        }
    }

    private async handleMcpPayload(payload: any): Promise<any | null> {
        // Support JSON-RPC batch payloads and skip notification responses.
        if (Array.isArray(payload)) {
            if (payload.length === 0) {
                return this.invalidRequestError(null);
            }
            const responses: any[] = [];
            for (const message of payload) {
                const response = await this.handleMessage(message);
                if (response !== null) {
                    responses.push(response);
                }
            }
            return responses.length > 0 ? responses : null;
        }

        if (!payload || typeof payload !== 'object') {
            return this.invalidRequestError(null);
        }

        return this.handleMessage(payload);
    }

    private async handleMessage(message: any): Promise<any | null> {
        if (!message || typeof message !== 'object') {
            return this.invalidRequestError(null);
        }

        const { id, method, params } = message;
        const isNotification = id === undefined || id === null;

        if (typeof method !== 'string') {
            if (isNotification) {
                return null;
            }
            return this.invalidRequestError(id ?? null);
        }

        try {
            let result: any;

            switch (method) {
                case 'tools/list':
                    result = { tools: this.getAvailableTools() };
                    break;
                case 'tools/call':
                    if (!params || typeof params.name !== 'string') {
                        throw new Error('Invalid params for tools/call');
                    }
                    const { name, arguments: args } = params;
                    const start = Date.now();
                    const toolResult = await this.executeToolCall(name, args);
                    const normalized = this.normalizeToolResult(name, toolResult, Date.now() - start);
                    result = { content: [{ type: 'text', text: JSON.stringify(normalized) }] };
                    break;
                case 'initialize':
                    // MCP initialization
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: 'cocos-mcp-server',
                            version: '1.0.0'
                        }
                    };
                    break;
                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            if (isNotification) {
                return null;
            }
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        } catch (error: any) {
            if (isNotification) {
                return null;
            }
            return {
                jsonrpc: '2.0',
                id,
                error: {
                    code: -32603,
                    message: error.message
                }
            };
        }
    }

    private fixCommonJsonIssues(jsonStr: string): string {
        let fixed = jsonStr;
        
        // Fix common escape character issues
        fixed = fixed
            // Fix unescaped quotes in strings
            .replace(/([^\\])"([^"]*[^\\])"([^,}\]:])/g, '$1\\"$2\\"$3')
            // Fix unescaped backslashes
            .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')
            // Fix trailing commas
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix single quotes (should be double quotes)
            .replace(/'/g, '"')
            // Fix common control characters
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
        
        return fixed;
    }

    public async stop(): Promise<void> {
        if (this.httpServer) {
            const server = this.httpServer;
            this.httpServer = null;
            await new Promise<void>((resolve) => {
                server.close(() => resolve());
            });
            console.log('[MCPServer] HTTP server stopped');
        }

        this.clients.clear();
    }

    public getStatus(): ServerStatus {
        return {
            running: !!this.httpServer,
            port: this.settings.port,
            clients: 0 // HTTP is stateless, no persistent clients
        };
    }

    private async handleSimpleAPIRequest(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<void> {
        try {
            const body = await this.readRequestBody(req, this.maxRequestBodyBytes);
            // Extract tool name from path like /api/node/set_position
            const pathParts = pathname.split('/').filter(p => p);
            if (pathParts.length < 3) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid API path. Use /api/{category}/{tool_name}' }));
                return;
            }

            const category = pathParts[1];
            const toolName = pathParts[2];
            const fullToolName = `${category}_${toolName}`;

            let params: any = {};
            if (body && body.trim().length > 0) {
                try {
                    params = this.parseJsonBody(body);
                } catch (parseError: any) {
                    res.writeHead(400);
                    res.end(JSON.stringify({
                        error: 'Invalid JSON in request body',
                        details: parseError.message,
                        receivedBody: body.substring(0, 200)
                    }));
                    return;
                }
            }

            // Execute tool
            const start = Date.now();
            const result = await this.executeToolCall(fullToolName, params);
            const normalized = this.normalizeToolResult(fullToolName, result, Date.now() - start);

            res.writeHead(200);
            res.end(JSON.stringify({
                success: true,
                tool: fullToolName,
                result: normalized
            }));
        } catch (error: any) {
            if (this.isBodyTooLargeError(error)) {
                res.writeHead(413);
                res.end(JSON.stringify({ error: 'Request body too large' }));
                return;
            }
            console.error('Simple API error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({
                success: false,
                error: error.message,
                tool: pathname
            }));
        }
    }

    private getSimplifiedToolsList(): any[] {
        if (this.simplifiedToolsCache) {
            return this.simplifiedToolsCache;
        }

        const simplified = this.toolsList.map(tool => {
            const parts = tool.name.split('_');
            const category = parts[0];
            const toolName = parts.slice(1).join('_');
            
            return {
                name: tool.name,
                category: category,
                toolName: toolName,
                description: tool.description,
                apiPath: `/api/${category}/${toolName}`,
                curlExample: this.generateCurlExample(category, toolName, tool.inputSchema),
                xCocos: (tool as any).xCocos
            };
        });
        this.simplifiedToolsCache = simplified;
        return simplified;
    }

    private generateCurlExample(category: string, toolName: string, schema: any): string {
        // Generate sample parameters based on schema
        const sampleParams = this.generateSampleParams(schema);
        const jsonString = JSON.stringify(sampleParams, null, 2);
        
        return `curl -X POST http://127.0.0.1:${this.settings.port}/api/${category}/${toolName} \\
  -H "Content-Type: application/json" \\
  -d '${jsonString}'`;
    }

    private generateSampleParams(schema: any): any {
        if (!schema || !schema.properties) return {};
        
        const sample: any = {};
        for (const [key, prop] of Object.entries(schema.properties as any)) {
            const propSchema = prop as any;
            switch (propSchema.type) {
                case 'string':
                    sample[key] = propSchema.default || 'example_string';
                    break;
                case 'number':
                    sample[key] = propSchema.default || 42;
                    break;
                case 'boolean':
                    sample[key] = propSchema.default || true;
                    break;
                case 'object':
                    sample[key] = propSchema.default || { x: 0, y: 0, z: 0 };
                    break;
                default:
                    sample[key] = 'example_value';
            }
        }
        return sample;
    }

    public async updateSettings(settings: MCPServerSettings): Promise<void> {
        this.settings = settings;
        this.simplifiedToolsCache = null;
        if (this.httpServer) {
            await this.stop();
            await this.start();
        }
    }

    private logDebug(message: string, ...args: any[]): void {
        if (this.settings.enableDebugLog) {
            console.log(message, ...args);
        }
    }

    private applyCorsHeaders(req: http.IncomingMessage, res: http.ServerResponse): boolean {
        const allowedOrigins = Array.isArray(this.settings.allowedOrigins) && this.settings.allowedOrigins.length > 0
            ? this.settings.allowedOrigins
            : ['*'];
        const origin = req.headers.origin as string | undefined;

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (allowedOrigins.includes('*')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            return true;
        }

        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
            return true;
        }

        return !origin;
    }

    private async readRequestBody(req: http.IncomingMessage, maxBytes: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let body = '';
            let totalBytes = 0;

            req.on('data', (chunk) => {
                totalBytes += chunk.length;
                if (totalBytes > maxBytes) {
                    const error: any = new Error(`Request body too large (limit ${maxBytes} bytes)`);
                    error.code = 'ERR_BODY_TOO_LARGE';
                    reject(error);
                    req.destroy();
                    return;
                }
                body += chunk.toString();
            });

            req.on('end', () => resolve(body));
            req.on('error', (err) => reject(err));
        });
    }

    private parseJsonBody(body: string): any {
        if (!body || body.trim().length === 0) {
            return {};
        }

        try {
            return JSON.parse(body);
        } catch (parseError: any) {
            const fixedBody = this.fixCommonJsonIssues(body);
            try {
                const parsed = JSON.parse(fixedBody);
                this.logDebug('[MCPServer] Fixed JSON parsing issue');
                return parsed;
            } catch (secondError) {
                throw new Error(`JSON parsing failed: ${parseError.message}`);
            }
        }
    }

    // Normalize tool responses into a consistent MCP-friendly shape.

    private normalizeToolResult(toolName: string, toolResult: any, durationMs: number): any {
        const meta = {
            tool: toolName,
            durationMs: durationMs,
            timestamp: new Date().toISOString()
        };

        if (toolResult && typeof toolResult === 'object' && !Array.isArray(toolResult)) {
            const normalized: any = { ...toolResult };
            const success = typeof normalized.success === 'boolean' ? normalized.success : undefined;
            normalized.ok = typeof normalized.ok === 'boolean' ? normalized.ok : (success !== undefined ? success : true);
            normalized.code = typeof normalized.code === 'number' ? normalized.code : (normalized.ok ? 0 : -1);
            if (!normalized.summary && typeof normalized.message === 'string') {
                normalized.summary = normalized.message;
            }
            if (!normalized._meta) {
                normalized._meta = meta;
            } else {
                normalized._meta = { ...meta, ...normalized._meta };
            }
            return normalized;
        }

        return {
            success: true,
            ok: true,
            code: 0,
            data: toolResult,
            _meta: meta
        };
    }

    private isBodyTooLargeError(error: any): boolean {
        return Boolean(error && (error.code === 'ERR_BODY_TOO_LARGE' || String(error.message).includes('too large')));
    }

    private invalidRequestError(id: any): any {
        return {
            jsonrpc: '2.0',
            id: id ?? null,
            error: {
                code: -32600,
                message: 'Invalid Request'
            }
        };
    }
}

// HTTP transport doesn't need persistent connections
// MCP over HTTP uses request-response pattern
