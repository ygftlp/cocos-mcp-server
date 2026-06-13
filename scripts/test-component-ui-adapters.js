'use strict';

const assert = require('assert');
const { selectCocosAdapter } = require('../dist/adapters/selector');
const { ComponentTools } = require('../dist/tools/component-tools');
const { UITools } = require('../dist/tools/ui-tools');

async function main() {
    const componentCalls = [];
    const nodeDump = {
        uuid: { value: 'node-1' },
        name: { value: 'ButtonNode' },
        active: { value: true },
        __comps__: [{
            __type__: 'cc.Button',
            uuid: { value: 'component-1' },
            enabled: { value: true },
            interactable: { value: true },
            clickEvents: { value: [] }
        }]
    };
    const fakeComponent = {
        createComponent: async (nodeUuid, componentType) => componentCalls.push(['create', nodeUuid, componentType]),
        removeComponent: async (nodeUuid, componentType) => componentCalls.push(['remove', nodeUuid, componentType]),
        queryNode: async () => nodeDump,
        setSerializedProperty: async (request) => componentCalls.push(['set', request])
    };

    const componentTools = new ComponentTools(fakeComponent);
    const added = await componentTools.execute('add_component', { nodeUuid: 'node-1', componentType: 'cc.Button' });
    assert.strictEqual(added.success, true);
    assert.deepStrictEqual(componentCalls[0], ['create', 'node-1', 'cc.Button']);

    const listed = await componentTools.execute('get_components', { nodeUuid: 'node-1' });
    assert.strictEqual(listed.data.components[0].type, 'cc.Button');
    assert.strictEqual(listed.data.components[0].uuid, 'component-1');

    const property = await componentTools.execute('set_component_property', {
        nodeUuid: 'node-1', componentType: 'cc.Button', property: 'interactable', propertyType: 'boolean', value: false
    });
    assert.strictEqual(property.success, true);
    const setCall = componentCalls.find((call) => call[0] === 'set');
    assert.strictEqual(setCall[1].path, '__comps__.0.interactable');
    assert.strictEqual(setCall[1].dump.value, false);

    const uiCalls = [];
    const fakeNode = {
        queryAssetInfo: async () => null,
        createNode: async () => ({ uuid: 'new-node' }),
        queryNode: async () => nodeDump,
        queryNodeTree: async () => ({ uuid: 'scene-1', name: 'Main', children: [{ uuid: 'node-1', name: 'ButtonNode', children: [] }] }),
        setNodeProperty: async () => undefined,
        removeNode: async () => undefined,
        setNodeParent: async () => undefined,
        duplicateNode: async () => ({ uuid: 'node-copy' })
    };
    const fakeScene = {
        queryNodeTree: fakeNode.queryNodeTree,
        executeSceneScript: async () => ({ success: true }),
        querySceneAssets: async () => [],
        queryAssetUuid: async () => null,
        openScene: async () => undefined,
        saveScene: async () => undefined,
        createScene: async () => ({}),
        openSaveAsDialog: async () => undefined,
        closeScene: async () => undefined
    };
    const fakeUI = {
        configureEvent: async (...args) => { uiCalls.push(['configure', ...args]); return { success: true, data: { configured: true } }; },
        listEvents: async (...args) => { uiCalls.push(['list', ...args]); return { success: true, data: { events: [] } }; }
    };
    const fakeAdapter = {
        profile: {
            adapterId: 'fake-38x', creatorVersion: '3.8.8', normalizedVersion: '3.8.8',
            versionRange: '>=3.8.6 <3.9.0', supportLevel: 'stable', writeEnabled: true,
            capabilities: {}, warnings: []
        },
        node: fakeNode,
        scene: fakeScene,
        component: fakeComponent,
        ui: fakeUI,
        request: async () => undefined,
        send: () => undefined,
        openPanel: () => undefined
    };

    const uiTools = new UITools(fakeAdapter);
    const catalog = await uiTools.execute('catalog', {});
    assert.strictEqual(catalog.data.adapterId, 'fake-38x');

    const inspected = await uiTools.execute('inspect', { nodeUuid: 'node-1', includeProperties: true });
    assert.strictEqual(inspected.data.uiComponents[0].type, 'cc.Button');

    const updated = await uiTools.execute('set_properties', {
        nodeUuid: 'node-1', componentType: 'cc.Button', properties: { interactable: false }
    });
    assert.strictEqual(updated.success, true);
    assert.ok(componentCalls.some((call) => call[0] === 'set' && call[1].path === '__comps__.0.interactable'));

    const configured = await uiTools.execute('configure_event', {
        nodeUuid: 'node-1', componentType: 'cc.Button', eventProperty: 'clickEvents',
        handlers: [{ targetNodeUuid: 'node-1', component: 'Controller', handler: 'onClick' }]
    });
    assert.strictEqual(configured.success, true);
    assert.strictEqual(uiCalls[0][0], 'configure');

    const stable = selectCocosAdapter('3.8.8');
    assert.strictEqual(stable.component.constructor.name, 'Creator38xComponentAdapter');
    assert.strictEqual(stable.ui.constructor.name, 'Creator38xUIAdapter');

    const preview = selectCocosAdapter('3.9.0');
    await assert.rejects(() => preview.component.queryNode('node-1'), /unavailable/);
    await assert.rejects(() => preview.ui.listEvents('node-1', 'cc.Button'), /unavailable/);

    console.log('Component and UI adapter contract tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
