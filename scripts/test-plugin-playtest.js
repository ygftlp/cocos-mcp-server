'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { injectRuntimeBridge, onAfterBuild } = require('../dist/builder-hooks');
const { ProjectCoreTools } = require('../dist/tools/core-project-tools');
const { MCPProtocolEngine } = require('../dist/mcp-protocol');

function makeAdapter(overrides = {}) {
    const calls = [];
    const runtimeState = { running: false };
    const adapter = {
        profile: {
            adapterId: 'creator-38x', creatorVersion: '3.8.8', normalizedVersion: '3.8.8',
            versionRange: '>=3.8.6 <3.9.0', supportLevel: 'stable', writeEnabled: true,
            capabilities: {}, warnings: []
        },
        project: {
            describe: () => ({ name: 'test-project', path: process.cwd(), uuid: 'project-1' }),
            queryConfig: async () => ({})
        },
        build: {
            queryWorkerReady: async () => { calls.push(['builder-ready']); return true; },
            build: async (options) => { calls.push(['build', options]); return { dest: options.buildPath || 'build/web-desktop' }; },
            openPanel: async () => { calls.push(['open-panel']); }
        },
        runtime: {
            stop: async () => { calls.push(['runtime-stop']); runtimeState.running = false; return { running: false }; },
            start: async (options) => {
                calls.push(['runtime-start', options]);
                runtimeState.running = true;
                return {
                    running: true, sessionId: 'session-1', url: 'http://127.0.0.1:1234/',
                    buildPath: options.buildPath || 'build/web-desktop', browserPath: '/chrome',
                    serverPort: 1234, debuggerPort: 9222, startedAt: '2026-06-13T00:00:00.000Z', pid: 42
                };
            },
            waitFor: async (expression) => { calls.push(['wait', expression]); return { ready: true }; },
            screenshot: async (options) => {
                calls.push(['screenshot', options]);
                return {
                    base64: Buffer.from('fake-png').toString('base64'),
                    mimeType: 'image/png',
                    filePath: '/project/.cocos-mcp/runtime-artifacts/playtest.png'
                };
            },
            logs: async () => ({ entries: [], nextSequence: 1 }),
            status: async () => ({ running: runtimeState.running }),
            reload: async () => undefined,
            evaluate: async () => undefined,
            mouse: async () => undefined,
            keyboard: async () => undefined,
            touch: async () => undefined
        },
        asset: { refreshAsset: async () => undefined },
        node: {}, scene: {}, sceneAdvanced: {}, component: {}, ui: {}, prefab: {},
        request: async () => undefined,
        send: () => undefined,
        openPanel: () => undefined,
        ...overrides
    };
    return { adapter, calls };
}

async function testBuildHook() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cocos-mcp-hook-'));
    try {
        fs.writeFileSync(path.join(root, 'index.html'), '<html><head><title>Game</title></head><body><canvas></canvas></body></html>', 'utf8');
        const first = injectRuntimeBridge(root, 'web-desktop');
        assert.ok(fs.existsSync(first.bridgePath));
        assert.ok(fs.existsSync(first.markerPath));
        const html = fs.readFileSync(first.indexPath, 'utf8');
        assert.ok(html.includes('cocos-mcp-test-bridge.js'));
        const bridge = fs.readFileSync(first.bridgePath, 'utf8');
        assert.ok(bridge.includes('__COCOS_MCP_TEST__'));
        assert.ok(bridge.includes('publish(key, value)'));

        injectRuntimeBridge(root, 'web-desktop');
        const idempotent = fs.readFileSync(first.indexPath, 'utf8');
        assert.strictEqual((idempotent.match(/cocos-mcp-test-bridge\.js/g) || []).length, 1);

        await onAfterBuild({ platform: 'web-desktop', dest: root }, { dest: root });
        assert.strictEqual((fs.readFileSync(first.indexPath, 'utf8').match(/cocos-mcp-test-bridge\.js/g) || []).length, 1);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

async function testSuccessfulPlaytest() {
    const { adapter, calls } = makeAdapter();
    const tools = new ProjectCoreTools(adapter);
    const definitions = tools.getTools();
    const playtest = definitions.find((tool) => tool.name === 'playtest');
    assert.ok(playtest, 'project_playtest must be exposed');
    assert.deepStrictEqual(playtest.xCocos.requires, ['project.build', 'runtime.write', 'runtime.read']);

    const result = await tools.execute('playtest', {
        platform: 'web-desktop',
        mode: 'editor',
        buildPath: 'build/web-desktop',
        screenshotPath: 'playtest.png'
    });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.runtime.running, true);
    assert.strictEqual(result.data.stages.every((stage) => stage.status === 'completed'), true);
    assert.strictEqual(result.data.logs.errorCount, 0);
    assert.ok(Array.isArray(result._mcpContent));
    assert.strictEqual(result._mcpContent[1].type, 'image');
    assert.deepStrictEqual(calls.slice(0, 5).map((entry) => entry[0]), [
        'runtime-stop', 'builder-ready', 'build', 'runtime-start', 'wait'
    ]);
}

async function testRollback() {
    const { adapter, calls } = makeAdapter();
    adapter.runtime.logs = async () => ({
        entries: [{ sequence: 1, timestamp: 'x', level: 'error', source: 'exception', text: 'boom' }],
        nextSequence: 2
    });
    const tools = new ProjectCoreTools(adapter);
    const result = await tools.execute('playtest', { platform: 'web-desktop', failOnRuntimeError: true });
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('Runtime produced 1 error'));
    assert.strictEqual(calls.filter((entry) => entry[0] === 'runtime-stop').length, 2);
    assert.ok(result.data.stages.some((stage) => stage.name === 'rollback-runtime-stop' && stage.status === 'completed'));
}

async function testMcpImageBlocks() {
    const engine = new MCPProtocolEngine(() => [], async () => ({
        success: true,
        data: { filePath: 'shot.png', bytes: 4 },
        _mcpContent: [
            { type: 'text', text: '{"success":true}' },
            { type: 'image', data: Buffer.from('shot').toString('base64'), mimeType: 'image/png' }
        ]
    }));
    const normalized = await engine.callTool('runtime_observe', {});
    const result = engine.toCallResult(normalized);
    assert.strictEqual(result.content[1].type, 'image');
    assert.strictEqual(result.content[1].mimeType, 'image/png');
    assert.strictEqual(result.structuredContent._mcpContent, undefined);
    assert.strictEqual(result.isError, false);
}

async function testPackageContribution() {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    assert.strictEqual(pkg.contributions.builder, './dist/builder');
    assert.deepStrictEqual(pkg.contributions.messages['run-playtest'].methods, ['runPlaytest']);
    assert.deepStrictEqual(pkg.contributions.messages['stop-playtest'].methods, ['stopPlaytest']);
}

async function main() {
    await testBuildHook();
    await testSuccessfulPlaytest();
    await testRollback();
    await testMcpImageBlocks();
    await testPackageContribution();
    console.log('Plugin-native playtest tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
