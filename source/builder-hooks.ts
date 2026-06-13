import * as fs from 'fs';
import * as path from 'path';

const BRIDGE_FILE = 'cocos-mcp-test-bridge.js';
const MARKER_FILE = '.cocos-mcp-runtime.json';
const SCRIPT_TAG = `<script src="./${BRIDGE_FILE}"></script>`;

export const throwError = false;

export async function onAfterBuild(options: any, result?: any): Promise<void> {
    const platform = String(options?.platform || options?.name || '').toLowerCase();
    if (platform && !platform.includes('web')) return;

    const buildRoot = resolveBuildRoot(options, result);
    if (!buildRoot) {
        console.warn('[cocos-mcp-server] Could not locate web build output for runtime bridge injection');
        return;
    }

    injectRuntimeBridge(buildRoot, platform || 'web');
}

export function resolveBuildRoot(options: any, result?: any): string | null {
    const candidates = collectPathCandidates(options, result);
    for (const candidate of candidates) {
        const root = locateIndexDirectory(candidate);
        if (root) return root;
    }
    return null;
}

export function injectRuntimeBridge(buildRoot: string, platform = 'web'): { bridgePath: string; indexPath: string; markerPath: string } {
    const root = path.resolve(buildRoot);
    const indexPath = path.join(root, 'index.html');
    if (!fs.existsSync(indexPath) || !fs.statSync(indexPath).isFile()) {
        throw new Error(`Cocos web build index.html not found: ${indexPath}`);
    }

    const bridgePath = path.join(root, BRIDGE_FILE);
    const markerPath = path.join(root, MARKER_FILE);
    fs.writeFileSync(bridgePath, bridgeSource(), 'utf8');

    const original = fs.readFileSync(indexPath, 'utf8');
    if (!original.includes(BRIDGE_FILE)) {
        const patched = original.includes('</head>')
            ? original.replace('</head>', `  ${SCRIPT_TAG}\n</head>`)
            : original.includes('<body')
                ? original.replace(/<body([^>]*)>/i, `${SCRIPT_TAG}\n<body$1>`)
                : `${SCRIPT_TAG}\n${original}`;
        fs.writeFileSync(indexPath, patched, 'utf8');
    }

    fs.writeFileSync(markerPath, JSON.stringify({
        injected: true,
        bridge: BRIDGE_FILE,
        platform,
        generatedAt: new Date().toISOString()
    }, null, 2), 'utf8');

    console.log(`[cocos-mcp-server] Runtime bridge injected into ${root}`);
    return { bridgePath, indexPath, markerPath };
}

function collectPathCandidates(options: any, result?: any): string[] {
    const values = new Set<string>();
    const preferredKeys = new Set([
        'dest', 'path', 'buildPath', 'outputPath', 'outputDir', 'root', 'directory', 'nativePrjDir', 'packagePath'
    ]);

    const visit = (value: any, depth: number, key?: string) => {
        if (depth > 4 || value === null || value === undefined) return;
        if (typeof value === 'string') {
            if (!key || preferredKeys.has(key) || /path|dest|output|root|dir/i.test(key)) values.add(value);
            return;
        }
        if (Array.isArray(value)) {
            for (const item of value.slice(0, 50)) visit(item, depth + 1, key);
            return;
        }
        if (typeof value === 'object') {
            for (const [childKey, child] of Object.entries(value)) visit(child, depth + 1, childKey);
        }
    };

    visit(result, 0);
    visit(options, 0);
    return Array.from(values)
        .filter((value) => value && !value.startsWith('db://'))
        .map((value) => path.resolve(value));
}

function locateIndexDirectory(candidate: string): string | null {
    try {
        if (!fs.existsSync(candidate)) return null;
        const stat = fs.statSync(candidate);
        if (stat.isFile()) return path.basename(candidate).toLowerCase() === 'index.html' ? path.dirname(candidate) : null;
        if (!stat.isDirectory()) return null;
        if (fs.existsSync(path.join(candidate, 'index.html'))) return candidate;
        for (const child of fs.readdirSync(candidate).slice(0, 100)) {
            const childPath = path.join(candidate, child);
            if (fs.existsSync(childPath) && fs.statSync(childPath).isDirectory() && fs.existsSync(path.join(childPath, 'index.html'))) {
                return childPath;
            }
        }
    } catch {
        return null;
    }
    return null;
}

function bridgeSource(): string {
    return `(() => {
    'use strict';
    if (globalThis.__COCOS_MCP_TEST__?.version) return;

    const published = Object.create(null);
    const errors = [];
    const events = [];
    let ready = document.readyState === 'complete';
    let sequence = 0;

    const clone = (value) => {
        try { return JSON.parse(JSON.stringify(value)); }
        catch { return String(value); }
    };
    const push = (type, payload) => {
        events.push({ sequence: ++sequence, timestamp: new Date().toISOString(), type, payload: clone(payload) });
        if (events.length > 1000) events.splice(0, events.length - 1000);
    };

    globalThis.addEventListener('load', () => { ready = true; push('ready', { ready: true }); });
    globalThis.addEventListener('error', (event) => {
        const entry = { message: event.message, filename: event.filename, line: event.lineno, column: event.colno };
        errors.push(entry); push('error', entry);
    });
    globalThis.addEventListener('unhandledrejection', (event) => {
        const entry = { message: String(event.reason?.stack || event.reason || 'Unhandled rejection') };
        errors.push(entry); push('unhandledrejection', entry);
    });

    const bridge = {
        version: '1.0.0',
        publish(key, value) {
            if (typeof key !== 'string' || !key) throw new Error('publish key is required');
            published[key] = clone(value);
            push('publish', { key, value: published[key] });
            return true;
        },
        remove(key) {
            delete published[key];
            push('remove', { key });
        },
        get(key) { return clone(published[key]); },
        getState() {
            const canvas = document.querySelector('canvas');
            return clone({
                ready,
                href: location.href,
                title: document.title,
                visibility: document.visibilityState,
                canvas: canvas ? {
                    width: canvas.width,
                    height: canvas.height,
                    clientWidth: canvas.clientWidth,
                    clientHeight: canvas.clientHeight
                } : null,
                published,
                errorCount: errors.length,
                lastError: errors.length ? errors[errors.length - 1] : null,
                eventSequence: sequence
            });
        },
        getErrors() { return clone(errors); },
        getEvents(since = 0) { return clone(events.filter((entry) => entry.sequence > Number(since || 0))); },
        clear() {
            for (const key of Object.keys(published)) delete published[key];
            errors.length = 0;
            events.length = 0;
            sequence = 0;
        }
    };

    Object.defineProperty(globalThis, '__COCOS_MCP_TEST__', {
        value: Object.freeze(bridge), configurable: false, enumerable: false, writable: false
    });
    push('bridge-installed', { version: bridge.version });
})();\n`;
}
