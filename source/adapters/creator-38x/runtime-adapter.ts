import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as http from 'http';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import {
    RuntimeAdapter,
    RuntimeKeyboardInput,
    RuntimeLogEntry,
    RuntimeLogLevel,
    RuntimeMouseInput,
    RuntimeScreenshotOptions,
    RuntimeSessionInfo,
    RuntimeStartOptions,
    RuntimeTouchInput
} from '../contracts/runtime-adapter';
import { CdpClient, CdpEvent } from '../../runtime/cdp-client';

const MIME_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.wasm': 'application/wasm',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.bin': 'application/octet-stream', '.cconb': 'application/octet-stream'
};

export class Creator38xRuntimeAdapter implements RuntimeAdapter {
    private server: http.Server | null = null;
    private browser: ChildProcess | null = null;
    private cdp: CdpClient | null = null;
    private tempDirectory: string | null = null;
    private sequence = 0;
    private logEntries: RuntimeLogEntry[] = [];
    private starting: Promise<RuntimeSessionInfo> | null = null;
    private session: RuntimeSessionInfo = this.emptySession();

    constructor(private readonly projectPath: string = Editor.Project.path) {}

    async start(options: RuntimeStartOptions = {}): Promise<RuntimeSessionInfo> {
        if (this.session.running) return this.status();
        if (this.starting) return this.starting;
        this.starting = this.startInternal(options).finally(() => { this.starting = null; });
        return this.starting;
    }

    async stop(): Promise<RuntimeSessionInfo> {
        const cdp = this.cdp;
        this.cdp = null;
        if (cdp) {
            try { cdp.close(); } catch { /* ignore */ }
        }

        const browser = this.browser;
        this.browser = null;
        if (browser && browser.exitCode === null) {
            await this.terminateProcess(browser, 3000);
        }

        const server = this.server;
        this.server = null;
        if (server) await new Promise<void>((resolve) => server.close(() => resolve()));

        const tempDirectory = this.tempDirectory;
        this.tempDirectory = null;
        if (tempDirectory) {
            try { fs.rmSync(tempDirectory, { recursive: true, force: true }); } catch { /* ignore */ }
        }

        this.session = this.emptySession();
        return { ...this.session };
    }

    async status(): Promise<RuntimeSessionInfo> {
        if (this.browser && this.browser.exitCode !== null) {
            this.session.running = false;
            this.session.pid = null;
        }
        return { ...this.session };
    }

    async reload(ignoreCache = true): Promise<void> {
        const cdp = this.requireCdp();
        await cdp.command('Page.reload', { ignoreCache: Boolean(ignoreCache) });
        await this.waitFor('document.readyState === "complete"', 30000, 100);
    }

    async evaluate(expression: string, awaitPromise = true): Promise<any> {
        if (!expression || typeof expression !== 'string') throw new Error('expression is required');
        const result = await this.requireCdp().command('Runtime.evaluate', {
            expression,
            awaitPromise: Boolean(awaitPromise),
            returnByValue: true,
            userGesture: true,
            includeCommandLineAPI: true
        });
        if (result.exceptionDetails) {
            const description = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed';
            throw new Error(description);
        }
        const remote = result.result || {};
        if (Object.prototype.hasOwnProperty.call(remote, 'value')) return remote.value;
        if (remote.unserializableValue !== undefined) return remote.unserializableValue;
        return remote.description ?? null;
    }

    async waitFor(expression: string, timeoutMs = 10000, intervalMs = 100): Promise<any> {
        const timeout = Math.max(100, Math.min(Number(timeoutMs) || 10000, 5 * 60 * 1000));
        const interval = Math.max(20, Math.min(Number(intervalMs) || 100, 5000));
        const deadline = Date.now() + timeout;
        let lastValue: any;
        let lastError: any;
        while (Date.now() <= deadline) {
            try {
                lastValue = await this.evaluate(expression, true);
                if (lastValue) return lastValue;
                lastError = null;
            } catch (error) {
                lastError = error;
            }
            await this.sleep(interval);
        }
        if (lastError) throw new Error(`Condition timed out: ${lastError?.message || String(lastError)}`);
        throw new Error(`Condition timed out after ${timeout}ms; last value: ${JSON.stringify(lastValue)}`);
    }

    async screenshot(options: RuntimeScreenshotOptions = {}): Promise<{ base64: string; mimeType: string; filePath?: string }> {
        const cdp = this.requireCdp();
        const format = options.format || 'png';
        const params: any = { format, fromSurface: true, captureBeyondViewport: Boolean(options.fullPage) };
        if ((format === 'jpeg' || format === 'webp') && options.quality !== undefined) {
            params.quality = Math.max(1, Math.min(100, Math.round(options.quality)));
        }
        if (options.fullPage) {
            const metrics = await cdp.command('Page.getLayoutMetrics');
            const size = metrics.cssContentSize || metrics.contentSize;
            if (size) params.clip = { x: 0, y: 0, width: size.width, height: size.height, scale: 1 };
        }
        const result = await cdp.command('Page.captureScreenshot', params, 30000);
        const base64 = String(result.data || '');
        if (!base64) throw new Error('Chrome returned an empty screenshot');
        const mimeType = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
        let filePath: string | undefined;
        if (options.filePath) {
            filePath = this.resolveArtifactPath(options.filePath);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        }
        return { base64, mimeType, ...(filePath ? { filePath } : {}) };
    }

    async mouse(input: RuntimeMouseInput): Promise<void> {
        const cdp = this.requireCdp();
        const button = input.button || (input.type === 'move' || input.type === 'wheel' ? 'none' : 'left');
        const common = { x: Number(input.x), y: Number(input.y), button, clickCount: input.clickCount || 1 };
        if (!Number.isFinite(common.x) || !Number.isFinite(common.y)) throw new Error('mouse x and y must be finite numbers');
        if (input.type === 'click') {
            await cdp.command('Input.dispatchMouseEvent', { type: 'mousePressed', ...common });
            await cdp.command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...common });
            return;
        }
        const typeMap: Record<string, string> = { move: 'mouseMoved', down: 'mousePressed', up: 'mouseReleased', wheel: 'mouseWheel' };
        const type = typeMap[input.type];
        if (!type) throw new Error(`Unsupported mouse input type: ${input.type}`);
        await cdp.command('Input.dispatchMouseEvent', {
            type,
            ...common,
            ...(input.type === 'wheel' ? { deltaX: input.deltaX || 0, deltaY: input.deltaY || 0 } : {})
        });
    }

    async keyboard(input: RuntimeKeyboardInput): Promise<void> {
        const cdp = this.requireCdp();
        if (!input.key) throw new Error('keyboard key is required');
        const params = {
            key: input.key,
            code: input.code || input.key,
            text: input.text,
            modifiers: input.modifiers || 0
        };
        if (input.type === 'press') {
            await cdp.command('Input.dispatchKeyEvent', { type: 'keyDown', ...params });
            await cdp.command('Input.dispatchKeyEvent', { type: 'keyUp', ...params, text: undefined });
            return;
        }
        await cdp.command('Input.dispatchKeyEvent', { type: input.type, ...params });
    }

    async touch(input: RuntimeTouchInput): Promise<void> {
        const cdp = this.requireCdp();
        if (!Array.isArray(input.points)) throw new Error('touch points must be an array');
        const touchPoints = input.points.map((point, index) => ({
            x: Number(point.x), y: Number(point.y), radiusX: point.radiusX || 1, radiusY: point.radiusY || 1,
            force: point.force ?? 1, id: point.id ?? index
        }));
        if (touchPoints.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
            throw new Error('touch coordinates must be finite numbers');
        }
        if (input.type === 'tap') {
            await cdp.command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
            await cdp.command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            return;
        }
        await cdp.command('Input.dispatchTouchEvent', {
            type: input.type,
            touchPoints: input.type === 'touchEnd' ? [] : touchPoints
        });
    }

    async logs(sinceSequence = 0, clear = false): Promise<{ entries: RuntimeLogEntry[]; nextSequence: number }> {
        const since = Math.max(0, Number(sinceSequence) || 0);
        const entries = this.logEntries.filter((entry) => entry.sequence > since).map((entry) => ({ ...entry }));
        const nextSequence = this.sequence + 1;
        if (clear) this.logEntries = [];
        return { entries, nextSequence };
    }

    private async startInternal(options: RuntimeStartOptions): Promise<RuntimeSessionInfo> {
        await this.stop();
        const buildPath = this.resolveBuildPath(options.buildPath);
        const browserPath = this.resolveBrowserPath(options.browserPath);
        const host = this.normalizeLoopbackHost(options.host);
        const width = Math.max(320, Math.min(7680, Number(options.width) || 1280));
        const height = Math.max(240, Math.min(4320, Number(options.height) || 720));
        const startupTimeout = Math.max(3000, Math.min(Number(options.startupTimeoutMs) || 30000, 120000));
        const server = await this.startStaticServer(buildPath, host, options.port);
        this.server = server.server;
        const debuggerPort = await this.findFreePort(host);
        this.tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cocos-mcp-runtime-'));
        const args = this.browserArguments(debuggerPort, width, height, options);
        const browser = spawn(browserPath, args, {
            cwd: buildPath,
            windowsHide: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
        this.browser = browser;
        browser.stdout?.on('data', (chunk) => this.appendLog('debug', 'browser.stdout', chunk.toString().trim()));
        browser.stderr?.on('data', (chunk) => this.appendLog('warning', 'browser.stderr', chunk.toString().trim()));
        browser.on('error', (error) => this.appendLog('error', 'browser.process', error.message));
        browser.on('exit', (code, signal) => {
            this.appendLog(code === 0 ? 'info' : 'error', 'browser.process', `Browser exited (code=${code}, signal=${signal})`);
            if (this.browser === browser) {
                this.session.running = false;
                this.session.pid = null;
            }
        });

        try {
            const target = await this.waitForDebuggerTarget(host, debuggerPort, startupTimeout);
            const cdp = new CdpClient();
            await cdp.connect(target.webSocketDebuggerUrl, startupTimeout);
            cdp.onEvent((event) => this.handleCdpEvent(event));
            this.cdp = cdp;
            await Promise.all([
                cdp.command('Runtime.enable'), cdp.command('Log.enable'), cdp.command('Page.enable'), cdp.command('Network.enable')
            ]);
            const url = `http://${host}:${server.port}/`;
            await cdp.command('Page.navigate', { url });
            await this.waitFor('document.readyState === "complete"', startupTimeout, 100);
            this.session = {
                running: true,
                sessionId: randomUUID(),
                url,
                buildPath,
                browserPath,
                serverPort: server.port,
                debuggerPort,
                startedAt: new Date().toISOString(),
                pid: browser.pid || null
            };
            this.appendLog('info', 'runtime', `Runtime session started at ${url}`);
            return { ...this.session };
        } catch (error) {
            await this.stop();
            throw error;
        }
    }

    private browserArguments(debuggerPort: number, width: number, height: number, options: RuntimeStartOptions): string[] {
        const args = [
            `--remote-debugging-address=127.0.0.1`, `--remote-debugging-port=${debuggerPort}`,
            `--user-data-dir=${this.tempDirectory}`, `--window-size=${width},${height}`,
            '--no-first-run', '--no-default-browser-check', '--disable-default-apps', '--disable-extensions',
            '--disable-background-networking', '--disable-sync', '--metrics-recording-only', '--mute-audio'
        ];
        if (options.headless !== false) args.push('--headless=new', '--hide-scrollbars');
        if (process.platform === 'linux' && typeof process.getuid === 'function' && process.getuid() === 0) args.push('--no-sandbox');
        if (Array.isArray(options.extraBrowserArgs)) {
            for (const argument of options.extraBrowserArgs) {
                if (typeof argument === 'string' && argument.startsWith('--') && !argument.startsWith('--remote-debugging-') && !argument.startsWith('--user-data-dir')) {
                    args.push(argument);
                }
            }
        }
        args.push('about:blank');
        return args;
    }

    private resolveBuildPath(input?: string): string {
        const candidates = input
            ? [path.isAbsolute(input) ? input : path.resolve(this.projectPath, input)]
            : [
                path.join(this.projectPath, 'build', 'web-desktop'),
                path.join(this.projectPath, 'build', 'web-mobile'),
                path.join(this.projectPath, 'build')
            ];
        for (const candidate of candidates) {
            const resolved = path.resolve(candidate);
            if (this.findIndexDirectory(resolved)) return this.findIndexDirectory(resolved)!;
        }
        throw new Error(`No Cocos web build with index.html found. Checked: ${candidates.join(', ')}`);
    }

    private findIndexDirectory(root: string): string | null {
        if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) return null;
        if (fs.existsSync(path.join(root, 'index.html'))) return root;
        for (const child of fs.readdirSync(root)) {
            const candidate = path.join(root, child);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() && fs.existsSync(path.join(candidate, 'index.html'))) return candidate;
        }
        return null;
    }

    private resolveBrowserPath(input?: string): string {
        if (input) {
            const resolved = this.resolveExecutable(input);
            if (resolved) return resolved;
            throw new Error(`Browser executable not found: ${input}`);
        }
        const env = process.env;
        const candidates = process.platform === 'win32'
            ? [
                path.join(env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
                path.join(env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'),
                path.join(env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
                path.join(env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
                path.join(env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe')
            ]
            : process.platform === 'darwin'
                ? [
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
                    '/Applications/Chromium.app/Contents/MacOS/Chromium'
                ]
                : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable'];
        for (const candidate of candidates) {
            const resolved = this.resolveExecutable(candidate);
            if (resolved) return resolved;
        }
        throw new Error('No Chromium browser found. Pass browserPath to runtime_start.');
    }

    private resolveExecutable(input: string): string | null {
        if (!input) return null;
        if (path.isAbsolute(input) || input.includes(path.sep)) {
            const resolved = path.resolve(input);
            return fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : null;
        }
        for (const directory of String(process.env.PATH || '').split(path.delimiter)) {
            const direct = path.join(directory, input);
            const windows = process.platform === 'win32' && !input.toLowerCase().endsWith('.exe') ? `${direct}.exe` : direct;
            if (fs.existsSync(windows) && fs.statSync(windows).isFile()) return windows;
        }
        return null;
    }

    private normalizeLoopbackHost(input?: string): string {
        const value = String(input || '127.0.0.1').toLowerCase();
        if (!['127.0.0.1', 'localhost', '::1'].includes(value)) throw new Error('Runtime host must be loopback-only');
        return value === 'localhost' ? '127.0.0.1' : value;
    }

    private async startStaticServer(root: string, host: string, requestedPort?: number): Promise<{ server: http.Server; port: number }> {
        const server = http.createServer((request, response) => this.serveFile(root, request, response));
        const port = Number.isInteger(requestedPort) && Number(requestedPort) > 0 ? Number(requestedPort) : 0;
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(port, host, () => {
                server.removeListener('error', reject);
                resolve();
            });
        });
        const address = server.address();
        if (!address || typeof address === 'string') {
            server.close();
            throw new Error('Unable to determine runtime server port');
        }
        return { server, port: address.port };
    }

    private serveFile(root: string, request: http.IncomingMessage, response: http.ServerResponse): void {
        try {
            const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
            let pathname = decodeURIComponent(requestUrl.pathname);
            if (pathname.includes('\0')) throw new Error('Invalid path');
            if (pathname.endsWith('/')) pathname += 'index.html';
            let filePath = path.resolve(root, `.${pathname}`);
            if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) throw new Error('Path escapes build root');
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                const fallback = path.join(root, 'index.html');
                if (!path.extname(pathname) && fs.existsSync(fallback)) filePath = fallback;
                else {
                    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
                    response.end('Not found');
                    return;
                }
            }
            const stat = fs.statSync(filePath);
            const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
            const range = request.headers.range;
            const headers: Record<string, string | number> = {
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
                'Accept-Ranges': 'bytes'
            };
            if (range) {
                const match = /^bytes=(\d*)-(\d*)$/.exec(range);
                if (match) {
                    const start = match[1] ? Number(match[1]) : 0;
                    const end = match[2] ? Number(match[2]) : stat.size - 1;
                    if (start <= end && end < stat.size) {
                        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
                        headers['Content-Length'] = end - start + 1;
                        response.writeHead(206, headers);
                        fs.createReadStream(filePath, { start, end }).pipe(response);
                        return;
                    }
                }
                response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
                response.end();
                return;
            }
            headers['Content-Length'] = stat.size;
            response.writeHead(200, headers);
            fs.createReadStream(filePath).pipe(response);
        } catch (error: any) {
            response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end(error?.message || 'Bad request');
        }
    }

    private async waitForDebuggerTarget(host: string, port: number, timeoutMs: number): Promise<any> {
        const deadline = Date.now() + timeoutMs;
        let lastError: any;
        while (Date.now() <= deadline) {
            try {
                const targets = await this.httpJson(`http://${host}:${port}/json/list`, 2000);
                const target = Array.isArray(targets) ? targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl) : null;
                if (target) return target;
            } catch (error) {
                lastError = error;
            }
            if (this.browser && this.browser.exitCode !== null) throw new Error(`Browser exited before DevTools became ready (code ${this.browser.exitCode})`);
            await this.sleep(100);
        }
        throw new Error(`Chrome DevTools did not become ready: ${lastError?.message || 'timeout'}`);
    }

    private httpJson(url: string, timeoutMs: number): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = http.get(url, { timeout: timeoutMs }, (response) => {
                let body = '';
                response.setEncoding('utf8');
                response.on('data', (chunk) => { body += chunk; });
                response.on('end', () => {
                    if ((response.statusCode || 500) >= 400) return reject(new Error(`HTTP ${response.statusCode}`));
                    try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
                });
            });
            request.on('timeout', () => request.destroy(new Error('HTTP request timed out')));
            request.on('error', reject);
        });
    }

    private handleCdpEvent(event: CdpEvent): void {
        const params = event.params || {};
        if (event.method === 'Runtime.consoleAPICalled') {
            const levelMap: Record<string, RuntimeLogLevel> = { error: 'error', warning: 'warning', debug: 'debug', info: 'info', log: 'info' };
            const text = (params.args || []).map((item: any) => this.remoteValueText(item)).join(' ');
            this.appendLog(levelMap[params.type] || 'info', 'console', text, { type: params.type, stackTrace: params.stackTrace });
        } else if (event.method === 'Runtime.exceptionThrown') {
            const details = params.exceptionDetails || {};
            this.appendLog('error', 'exception', details.exception?.description || details.text || 'Uncaught exception', details);
        } else if (event.method === 'Log.entryAdded') {
            const entry = params.entry || {};
            const level: RuntimeLogLevel = entry.level === 'error' ? 'error' : entry.level === 'warning' ? 'warning' : entry.level === 'debug' ? 'debug' : 'info';
            this.appendLog(level, entry.source || 'log', entry.text || '', entry);
        } else if (event.method === 'Network.loadingFailed') {
            this.appendLog('warning', 'network', `${params.errorText || 'Loading failed'}: ${params.blockedReason || params.type || ''}`, params);
        } else if (event.method === 'Page.javascriptDialogOpening') {
            this.appendLog('warning', 'dialog', params.message || 'JavaScript dialog opened', params);
        }
    }

    private remoteValueText(value: any): string {
        if (Object.prototype.hasOwnProperty.call(value || {}, 'value')) {
            try { return typeof value.value === 'string' ? value.value : JSON.stringify(value.value); } catch { return String(value.value); }
        }
        return value?.description || value?.unserializableValue || value?.type || '';
    }

    private appendLog(level: RuntimeLogLevel, source: string, text: string, details?: any): void {
        if (!text) return;
        this.logEntries.push({
            sequence: ++this.sequence,
            timestamp: new Date().toISOString(),
            level,
            source,
            text: text.slice(0, 20000),
            ...(details !== undefined ? { details } : {})
        });
        if (this.logEntries.length > 5000) this.logEntries.splice(0, this.logEntries.length - 5000);
    }

    private resolveArtifactPath(input: string): string {
        const value = input.trim();
        const artifactRoot = path.resolve(this.projectPath, '.cocos-mcp', 'runtime-artifacts');
        const resolved = path.isAbsolute(value) ? path.resolve(value) : path.resolve(artifactRoot, value);
        if (resolved !== artifactRoot && !resolved.startsWith(`${artifactRoot}${path.sep}`)) {
            throw new Error('Screenshot filePath must stay under .cocos-mcp/runtime-artifacts');
        }
        return resolved;
    }

    private requireCdp(): CdpClient {
        if (!this.session.running || !this.cdp) throw new Error('Runtime session is not running');
        return this.cdp;
    }

    private async findFreePort(host: string): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = net.createServer();
            server.once('error', reject);
            server.listen(0, host, () => {
                const address = server.address();
                if (!address || typeof address === 'string') {
                    server.close();
                    reject(new Error('Unable to allocate debugger port'));
                    return;
                }
                const port = address.port;
                server.close((error) => error ? reject(error) : resolve(port));
            });
        });
    }

    private async terminateProcess(processHandle: ChildProcess, timeoutMs: number): Promise<void> {
        await new Promise<void>((resolve) => {
            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(() => {
                try { processHandle.kill('SIGKILL'); } catch { /* ignore */ }
                finish();
            }, timeoutMs);
            processHandle.once('exit', finish);
            try { processHandle.kill('SIGTERM'); } catch { finish(); }
            if (processHandle.exitCode !== null) finish();
        });
    }

    private emptySession(): RuntimeSessionInfo {
        return {
            running: false, sessionId: null, url: null, buildPath: null, browserPath: null,
            serverPort: null, debuggerPort: null, startedAt: null, pid: null
        };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
