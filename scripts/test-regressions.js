'use strict';

const assert = require('assert');

global.Editor = global.Editor || {
    Project: { path: process.cwd(), name: 'test-project', uuid: 'test-project' },
    Message: {
        request: async () => { throw new Error('Editor API is not available in unit tests'); },
        send: () => undefined
    },
    Panel: { open: () => undefined },
    versions: { cocos: '3.8-test' }
};

const { ToolRegistry } = require('../dist/tools/tool-registry');
const { ServerTools } = require('../dist/tools/server-tools');
const { buildActionSchema } = require('../dist/tools/core-action-utils');
const { reconcileTools } = require('../dist/tools/tool-manager');
const { normalizeSettingsData } = require('../dist/settings');

async function main() {
    const registry = new ToolRegistry();
    assert.ok(registry.buildRuntime(undefined).toolsList.length > 0, 'undefined filter should expose registry defaults');
    assert.strictEqual(registry.buildRuntime([]).toolsList.length, 0, 'empty filter must disable every tool');

    const toolNames = registry.listToolConfigs().map((tool) => `${tool.category}_${tool.name}`);
    assert.ok(!toolNames.some((name) => name.startsWith('broadcast_')), 'simulated broadcast tools must not be public');
    assert.ok(!toolNames.includes('project_preview'), 'unsupported preview server tool must not be public');
    assert.ok(!toolNames.includes('debug_console'), 'placeholder console capture tool must not be public');
    assert.ok(!toolNames.includes('asset_dependency'), 'unsupported dependency tool must not be public');
    assert.ok(!toolNames.includes('asset_compress'), 'unsupported compression tool must not be public');

    const available = [
        { category: 'node', name: 'query', enabled: true, description: 'query' },
        { category: 'project', name: 'quick_start', enabled: true, description: 'quick start' }
    ];
    const migrated = reconcileTools([
        { category: 'node', name: 'query', enabled: false, description: 'old query' }
    ], available);
    assert.strictEqual(migrated[0].enabled, false, 'existing user choice must be preserved');
    assert.strictEqual(migrated[1].enabled, true, 'new tools must use the registry default');

    const fakeExecutor = { execute: async () => ({ success: true }) };
    const schema = buildActionSchema({
        open: { executor: fakeExecutor, method: 'open_scene' },
        current: { executor: fakeExecutor, method: 'get_current_scene' }
    }, 'scene parameters');
    assert.strictEqual(schema.oneOf.length, 2, 'each action must have its own schema branch');
    const openBranch = schema.oneOf.find((branch) => branch.properties.action.enum[0] === 'open');
    assert.ok(openBranch.properties.params.required.includes('scenePath'), 'open_scene schema must require scenePath');

    const executed = [];
    const serverTools = new ServerTools({
        executeToolCall: async (name, args) => {
            executed.push({ name, args });
            return name === 'bad_tool' ? { success: false, error: 'bad' } : { success: true, name };
        },
        invalidateCaches: (scope) => scope === 'all' ? 3 : 1
    });
    const batch = await serverTools.execute('batch_call', {
        calls: [
            { name: 'node_query', arguments: { action: 'list' } },
            { name: 'bad_tool', arguments: {} }
        ]
    });
    assert.strictEqual(batch.success, false);
    assert.strictEqual(batch.data.executed, 2);
    assert.strictEqual(executed.length, 2);

    const recursive = await serverTools.execute('batch_call', {
        calls: [{ name: 'server_batch', arguments: {} }]
    });
    assert.strictEqual(recursive.success, false, 'recursive batches must be rejected');

    const invalidated = await serverTools.execute('invalidate_cache', { scope: 'all' });
    assert.strictEqual(invalidated.success, true);
    assert.strictEqual(invalidated.data.cleared, 3);

    const settings = normalizeSettingsData({ port: 3000, allowedOrigins: [] });
    assert.deepStrictEqual(settings.allowedOrigins, ['http://127.0.0.1:0']);
    assert.ok(typeof settings.authToken === 'string' && settings.authToken.length >= 32, 'an auth token must be generated');

    console.log('Regression tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
