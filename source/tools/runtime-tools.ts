import { RuntimeAdapter } from '../adapters/contracts/runtime-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class RuntimeTools implements ToolExecutor {
    constructor(private readonly runtime: RuntimeAdapter = selectCocosAdapter().runtime) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const input = args || {};
        try {
            switch (toolName) {
                case 'runtime_start': return { success: true, data: await this.runtime.start(input) };
                case 'runtime_stop': return { success: true, data: await this.runtime.stop() };
                case 'runtime_status': return { success: true, data: await this.runtime.status() };
                case 'runtime_reload':
                    await this.runtime.reload(input.ignoreCache !== false);
                    return { success: true, data: { reloaded: true } };
                case 'runtime_evaluate': return this.evaluate(input);
                case 'runtime_wait_for': return this.waitFor(input);
                case 'runtime_screenshot': return this.screenshot(input);
                case 'runtime_logs': return this.logs(input);
                case 'runtime_mouse':
                    await this.runtime.mouse(input);
                    return { success: true, data: { dispatched: true, type: input.type } };
                case 'runtime_keyboard':
                    await this.runtime.keyboard(input);
                    return { success: true, data: { dispatched: true, type: input.type, key: input.key } };
                case 'runtime_touch':
                    await this.runtime.touch(input);
                    return { success: true, data: { dispatched: true, type: input.type, pointCount: input.points?.length || 0 } };
                default: throw new Error(`Unknown tool: ${toolName}`);
            }
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async evaluate(args: any): Promise<ToolResponse> {
        const expression = String(args.expression || '');
        if (!expression) return { success: false, error: 'expression is required' };
        if (expression.length > 100000) return { success: false, error: 'expression exceeds 100000 characters' };
        const value = await this.runtime.evaluate(expression, args.awaitPromise !== false);
        return { success: true, data: { value } };
    }

    private async waitFor(args: any): Promise<ToolResponse> {
        const expression = String(args.expression || '');
        if (!expression) return { success: false, error: 'expression is required' };
        const value = await this.runtime.waitFor(expression, args.timeoutMs, args.intervalMs);
        return { success: true, data: { matched: true, value } };
    }

    private async screenshot(args: any): Promise<ToolResponse> {
        const format = args.format || 'png';
        const extension = format === 'jpeg' ? 'jpg' : format;
        const filePath = args.filePath || `runtime-${Date.now()}.${extension}`;
        const result = await this.runtime.screenshot({
            format,
            quality: args.quality,
            filePath,
            fullPage: Boolean(args.fullPage)
        });
        const bytes = Buffer.byteLength(result.base64, 'base64');
        return {
            success: true,
            data: {
                mimeType: result.mimeType,
                filePath: result.filePath,
                bytes,
                ...(args.returnBase64 ? { base64: result.base64 } : {})
            }
        };
    }

    private async logs(args: any): Promise<ToolResponse> {
        const result = await this.runtime.logs(args.sinceSequence, Boolean(args.clear));
        const levels = Array.isArray(args.levels) ? new Set(args.levels) : null;
        const source = typeof args.source === 'string' && args.source ? args.source.toLowerCase() : null;
        let entries = result.entries.filter((entry) => {
            if (levels && !levels.has(entry.level)) return false;
            if (source && !entry.source.toLowerCase().includes(source)) return false;
            return true;
        });
        const limit = Math.max(1, Math.min(5000, Number(args.limit) || 500));
        if (entries.length > limit) entries = entries.slice(entries.length - limit);
        return {
            success: true,
            data: {
                entries,
                count: entries.length,
                nextSequence: result.nextSequence,
                cleared: Boolean(args.clear)
            }
        };
    }
}
