import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';

export interface ServerToolDependencies {
    executeToolCall: (toolName: string, args: any) => Promise<any>;
    invalidateCaches: (scope?: string) => number;
}

export class ServerTools implements ToolExecutor {
    constructor(private readonly dependencies: ServerToolDependencies) {}

    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'query_server_ip_list':
                return this.queryServerIPList();
            case 'query_sorted_server_ip_list':
                return this.querySortedServerIPList();
            case 'query_server_port':
                return this.queryServerPort();
            case 'get_server_status':
                return this.getServerStatus();
            case 'check_server_connectivity':
                return this.checkServerConnectivity(args?.timeout);
            case 'get_network_interfaces':
                return this.getNetworkInterfaces();
            case 'batch_call':
                return this.batchCall(args?.calls, args?.stopOnError);
            case 'invalidate_cache':
                return this.invalidateCache(args?.scope);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async queryServerIPList(): Promise<ToolResponse> {
        try {
            const ipList = await Editor.Message.request('server', 'query-ip-list') as string[];
            return { success: true, data: { ipList, count: ipList.length } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async querySortedServerIPList(): Promise<ToolResponse> {
        try {
            const sortedIPList = await Editor.Message.request('server', 'query-sort-ip-list') as string[];
            return { success: true, data: { sortedIPList, count: sortedIPList.length } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async queryServerPort(): Promise<ToolResponse> {
        try {
            const port = await Editor.Message.request('server', 'query-port') as number;
            return { success: true, data: { port } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getServerStatus(): Promise<ToolResponse> {
        const [ipListResult, portResult] = await Promise.all([
            this.queryServerIPList(),
            this.queryServerPort()
        ]);

        return {
            success: true,
            data: {
                timestamp: new Date().toISOString(),
                editorServerReachable: ipListResult.success || portResult.success,
                availableIPs: ipListResult.success ? ipListResult.data?.ipList || [] : [],
                port: portResult.success ? portResult.data?.port ?? null : null,
                ipError: ipListResult.success ? undefined : ipListResult.error,
                portError: portResult.success ? undefined : portResult.error,
                editorVersion: (Editor as any).versions?.cocos || (Editor as any).versions?.editor || 'Unknown',
                platform: process.platform,
                nodeVersion: process.version
            }
        };
    }

    private async checkServerConnectivity(timeout: number = 5000): Promise<ToolResponse> {
        const safeTimeout = Number.isFinite(timeout) ? Math.max(100, Math.min(timeout, 60000)) : 5000;
        const startedAt = Date.now();
        let timer: ReturnType<typeof setTimeout> | undefined;

        try {
            await Promise.race([
                Editor.Message.request('server', 'query-port'),
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Connection timeout')), safeTimeout);
                })
            ]);
            return {
                success: true,
                data: { connected: true, responseTime: Date.now() - startedAt, timeout: safeTimeout }
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || String(error),
                data: { connected: false, responseTime: Date.now() - startedAt, timeout: safeTimeout }
            };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    private async getNetworkInterfaces(): Promise<ToolResponse> {
        try {
            const os = require('os');
            const interfaces = os.networkInterfaces();
            const networkInterfaces = Object.entries(interfaces).map(([name, addresses]: [string, any]) => ({
                name,
                addresses: (addresses || []).map((address: any) => ({
                    address: address.address,
                    family: address.family,
                    internal: address.internal,
                    cidr: address.cidr
                }))
            }));
            const serverIPResult = await this.queryServerIPList();
            return {
                success: true,
                data: {
                    networkInterfaces,
                    serverAvailableIPs: serverIPResult.success ? serverIPResult.data?.ipList || [] : []
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async batchCall(calls: any, stopOnError: boolean = false): Promise<ToolResponse> {
        if (!Array.isArray(calls) || calls.length === 0) {
            return { success: false, error: 'calls must be a non-empty array' };
        }
        if (calls.length > 20) {
            return { success: false, error: 'A batch can contain at most 20 calls' };
        }

        const results: any[] = [];
        let failed = 0;
        for (let index = 0; index < calls.length; index++) {
            const call = calls[index];
            const name = call?.name;
            if (typeof name !== 'string' || !name) {
                const result = { index, name: null, success: false, error: 'Tool name is required' };
                results.push(result);
                failed++;
                if (stopOnError) break;
                continue;
            }
            if (name === 'server_batch') {
                const result = { index, name, success: false, error: 'Recursive server_batch calls are not allowed' };
                results.push(result);
                failed++;
                if (stopOnError) break;
                continue;
            }

            try {
                const value = await this.dependencies.executeToolCall(name, call?.arguments || {});
                const success = value?.success !== false && value?.ok !== false;
                if (!success) failed++;
                results.push({ index, name, success, result: value });
                if (!success && stopOnError) break;
            } catch (error: any) {
                failed++;
                results.push({ index, name, success: false, error: error?.message || String(error) });
                if (stopOnError) break;
            }
        }

        return {
            success: failed === 0,
            data: {
                requested: calls.length,
                executed: results.length,
                succeeded: results.length - failed,
                failed,
                stoppedEarly: results.length < calls.length,
                results
            },
            ...(failed > 0 ? { error: `${failed} batch call(s) failed` } : {})
        };
    }

    private async invalidateCache(scope: string = 'all'): Promise<ToolResponse> {
        const allowed = new Set(['all', 'scene', 'nodes', 'assets', 'project']);
        if (!allowed.has(scope)) {
            return { success: false, error: `Unsupported cache scope: ${scope}` };
        }
        const cleared = this.dependencies.invalidateCaches(scope);
        return { success: true, data: { scope, cleared } };
    }
}
