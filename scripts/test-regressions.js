'use strict';

const assert = require('assert');
const path = require('path');
const packageJson = require('../package.json');

global.Editor = global.Editor || {
    Project: { path: path.join(process.cwd(), '.tmp-test-project'), name: 'test-project', uuid: 'test-project' },
    App: { path: process.cwd() },
    Message: {
        request: async () => { throw new Error('Editor API is not available in unit tests'); },
        send: () => undefined
    },
    Panel: { open: () => undefined },
    versions: { cocos: '3.8.6' }
};

const { selectCocosAdapter } = require('../dist/adapters/selector');
const { MCPProtocolEngine } = require('../dist/mcp-protocol');
const { ToolRegistry } = require('../dist/tools/tool-registry');
const { ServerTools } = require('../dist/tools/server-tools');
const { GameProjectTools } = require('../dist/tools/game-project-tools');
const { buildActionSchema } = require('../dist/tools/core-action-utils');
const { reconcileTools } = require('../dist/tools/tool-manager');
const { normalizeSettingsData } = require('../dist/settings');
const {
    UI_COMPONENT_CATALOG,
    findUIComponent,
    normalizeUIComponentClass
} = require('../dist/tools/ui-component-catalog');

async function main() {
    const stableAdapter = selectCocosAdapter('3.8.6');
    assert.strictEqual(stableAdapter.profile.adapterId, 'creator-38x');
    assert.strictEqual(stableAdapter.profile.supportLevel, 'stable');
    assert.strictEqual(stableAdapter.profile.writeEnabled, true);

    const registry = new ToolRegistry(stableAdapter);
    const runtime = registry.buildRuntime(undefined);
    assert.ok(runtime.toolsList.length > 0, 'undefined filter should expose registry defaults');
    assert.strictEqual(registry.buildRuntime([]).toolsList.length, 0, 'empty filter must disable every tool');

    const toolNames = registry.listToolConfigs().map((tool) => `${tool.category}_${tool.name}`);
    assert.ok(toolNames.includes('compatibility_info'));
    assert.ok(toolNames.includes('compatibility_check'));
    assert.ok(toolNames.includes('project_create_game'), 'complete game composition tool must be public');
    for (const name of ['ui_catalog', 'ui_query', 'ui_element', 'ui_event', 'ui_validate']) {
        assert.ok(toolNames.includes(name), `${name} must be public`);
        const definition = runtime.toolsList.find((tool) => tool.name === name);
        assert.ok(definition && definition.inputSchema, `${name} must expose an MCP JSON Schema`);
    }
    assert.ok(!toolNames.some((name) => name.startsWith('broadcast_')), 'simulated broadcast tools must not be public');
    assert.ok(!toolNames.includes('project_preview'), 'unsupported preview server tool must not be public');
    assert.ok(!toolNames.includes('debug_console'), 'placeholder console capture tool must not be public');
    assert.ok(!toolNames.includes('asset_dependency'), 'unsupported dependency tool must not be public');
    assert.ok(!toolNames.includes('asset_compress'), 'unsupported compression tool must not be public');

    const previewRegistry = new ToolRegistry(selectCocosAdapter('3.9.0'));
    const previewNames = previewRegistry.buildRuntime(undefined).toolsList.map((tool) => tool.name).sort();
    assert.deepStrictEqual(previewNames, ['compatibility_check', 'compatibility_info']);
    const previewReport = previewRegistry.getCompatibilityReport();
    assert.strictEqual(previewReport.adapterId, 'creator-39x');
    assert.strictEqual(previewReport.supportLevel, 'preview');
    assert.strictEqual(previewReport.writeEnabled, false);
    assert.ok(previewReport.disabledToolCount > 0);
    assert.ok(previewReport.disabledTools.some((tool) => tool.name === 'project_build'));

    const unsupportedRegistry = new ToolRegistry(selectCocosAdapter('4.0.0'));
    const unsupportedNames = unsupportedRegistry.buildRuntime(undefined).toolsList.map((tool) => tool.name).sort();
    assert.deepStrictEqual(unsupportedNames, ['compatibility_check', 'compatibility_info']);
    assert.strictEqual(unsupportedRegistry.getCompatibilityReport().supportLevel, 'unsupported');

    const old38 = selectCocosAdapter('3.8.5');
    assert.strictEqual(old38.profile.supportLevel, 'unsupported');
    assert.ok(old38.profile.warnings.some((warning) => warning.includes('3.8.6')));

    const protocol = new MCPProtocolEngine(
        () => runtime.toolsList,
        async () => ({ success: true }),
        'test',
        () => registry.getCompatibilityReport()
    );
    const initialized = await protocol.handlePayload({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
    assert.ok(initialized.result.capabilities.resources);
    assert.ok(initialized.result.instructions.includes('creator-38x'));
    const resources = await protocol.handlePayload({ jsonrpc: '2.0', id: 2, method: 'resources/list' });
    assert.strictEqual(resources.result.resources[0].uri, 'cocos://compatibility');
    const compatibilityResource = await protocol.handlePayload({ jsonrpc: '2.0', id: 3, method: 'resources/read', params: { uri: 'cocos://compatibility' } });
    const resourceData = JSON.parse(compatibilityResource.result.contents[0].text);
    assert.strictEqual(resourceData.adapterId, 'creator-38x');

    const officialUIClasses = [
        'cc.Canvas', 'cc.UITransform', 'cc.Widget', 'cc.Button', 'cc.Layout', 'cc.EditBox',
        'cc.ScrollView', 'cc.ScrollBar', 'cc.ProgressBar', 'cc.LabelOutline', 'cc.LabelShadow',
        'cc.Toggle', 'cc.ToggleContainer', 'cc.Slider', 'cc.PageView', 'cc.PageViewIndicator',
        'cc.UIMeshRenderer', 'cc.UICoordinateTracker', 'cc.UIOpacity', 'cc.UISkew',
        'cc.BlockInputEvents', 'cc.WebView', 'cc.VideoPlayer', 'cc.SafeArea',
        'cc.Sprite', 'cc.Label', 'cc.Mask', 'cc.Graphics', 'cc.RichText', 'cc.UIStaticBatch'
    ];
    const catalogClasses = new Set(UI_COMPONENT_CATALOG.map((item) => item.className));
    for (const className of officialUIClasses) {
        assert.ok(catalogClasses.has(className), `UI catalog is missing ${className}`);
    }
    assert.strictEqual(new Set(UI_COMPONENT_CATALOG.map((item) => item.id)).size, UI_COMPONENT_CATALOG.length, 'UI catalog ids must be unique');
    assert.strictEqual(findUIComponent('button').className, 'cc.Button');
    assert.strictEqual(findUIComponent('cc.ScrollView').id, 'scroll-view');
    assert.strictEqual(normalizeUIComponentClass('ProjectDialog'), 'ProjectDialog', 'custom UI classes must remain addressable');
    assert.ok(findUIComponent('button').eventProperties.includes('clickEvents'), 'Button clickEvents must be discoverable');
    assert.ok(findUIComponent('edit-box').eventProperties.includes('textChanged'), 'EditBox events must be discoverable');

    assert.strictEqual(packageJson.contributions.scene.script, './dist/scene-entry.js');
    assert.ok(packageJson.contributions.scene.methods.includes('configureUIEvent'));
    assert.ok(packageJson.contributions.scene.methods.includes('getUIEventHandlers'));
    assert.ok(packageJson.contributions.messages['get-compatibility']);

    const available = [
        { category: 'node', name: 'query', enabled: true, description: 'query' },
        { category: 'project', name: 'create_game', enabled: true, description: 'complete game' },
        { category: 'ui', name: 'catalog', enabled: true, description: 'ui catalog' }
    ];
    const migrated = reconcileTools([
        { category: 'node', name: 'query', enabled: false, description: 'old query' }
    ], available);
    assert.strictEqual(migrated[0].enabled, false, 'existing user choice must be preserved');
    assert.strictEqual(migrated[1].enabled, true, 'new tools must use the registry default');
    assert.strictEqual(migrated[2].enabled, true, 'new UI tools must use the registry default');

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

    const gameTools = new GameProjectTools();
    const playablePlan = await gameTools.execute('create_game', {
        template: 'arcade-clicker-2d', projectName: 'Regression Game', dryRun: true
    });
    assert.strictEqual(playablePlan.success, true);
    assert.strictEqual(playablePlan.data.template, 'arcade-clicker-2d');
    assert.strictEqual(playablePlan.data.files.length, 3);
    assert.strictEqual(playablePlan.data.nodes.length, 2);
    assert.strictEqual(playablePlan.data.sceneUrl, 'db://assets/game/scenes/Main.scene');

    const customPlan = await gameTools.execute('create_game', {
        template: 'custom', dryRun: true,
        blueprint: {
            files: [{ path: 'scripts/Entry.ts', content: 'export const ready = true;\n' }],
            nodes: [{ id: 'root', name: 'Root' }]
        }
    });
    assert.strictEqual(customPlan.success, true);
    assert.strictEqual(customPlan.data.template, 'custom');

    const traversal = await gameTools.execute('create_game', {
        template: 'custom', dryRun: true,
        blueprint: {
            files: [{ path: '../escape.ts', content: 'x' }],
            nodes: [{ id: 'root', name: 'Root' }]
        }
    });
    assert.strictEqual(traversal.success, false, 'custom blueprint must reject file traversal');

    console.log('Regression tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
