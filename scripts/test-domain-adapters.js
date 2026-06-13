'use strict';

const assert = require('assert');
const { selectCocosAdapter } = require('../dist/adapters/selector');
const { NodeTools } = require('../dist/tools/node-tools');
const { SceneTools } = require('../dist/tools/scene-tools');

async function main() {
    const nodeCalls = [];
    const fakeNode = {
        queryAssetInfo: async (assetPath) => ({ uuid: { value: 'asset-1' }, assetPath }),
        createNode: async (request) => { nodeCalls.push(['createNode', request]); return { uuid: { value: 'node-1' } }; },
        queryNode: async () => ({
            uuid: { value: 'node-1' }, name: { value: 'Player' }, active: { value: true },
            position: { value: { x: 1, y: 2, z: 3 } },
            rotation: { value: { x: 0, y: 0, z: 0 } },
            scale: { value: { x: 1, y: 1, z: 1 } },
            parent: { value: { uuid: 'root' } },
            children: [{ uuid: 'child' }],
            __comps__: [{ __type__: 'cc.Sprite', enabled: { value: true } }]
        }),
        queryNodeTree: async () => ({ uuid: 'root', name: 'Scene', children: [{ uuid: 'node-1', name: 'Player', children: [] }] }),
        setNodeProperty: async (request) => { nodeCalls.push(['setNodeProperty', request]); },
        removeNode: async (uuid) => { nodeCalls.push(['removeNode', uuid]); },
        setNodeParent: async (request) => { nodeCalls.push(['setNodeParent', request]); },
        duplicateNode: async () => ({ uuid: 'node-copy' })
    };

    const nodeTools = new NodeTools(fakeNode);
    const created = await nodeTools.execute('create_node', { name: 'Player', assetPath: 'db://assets/player.prefab' });
    assert.strictEqual(created.success, true);
    assert.strictEqual(created.data.uuid, 'node-1');
    assert.strictEqual(nodeCalls[0][1].assetUuid, 'asset-1');

    const info = await nodeTools.execute('get_node_info', { uuid: 'node-1' });
    assert.deepStrictEqual(info.data.position, { x: 1, y: 2, z: 3 });
    assert.strictEqual(info.data.components[0].type, 'cc.Sprite');

    const transformed = await nodeTools.execute('set_node_transform', {
        uuid: 'node-1', position: { x: 5, y: 6, z: 7 }, scale: { x: 2, y: 2, z: 2 }
    });
    assert.strictEqual(transformed.success, true);
    assert.strictEqual(nodeCalls.filter((call) => call[0] === 'setNodeProperty').length, 2);

    const found = await nodeTools.execute('find_node_by_name', { name: 'Player' });
    assert.strictEqual(found.data.uuid, 'node-1');

    const sceneCalls = [];
    const fakeScene = {
        queryNodeTree: async () => ({ uuid: 'scene-1', name: 'Main', type: 'cc.Scene', active: true, children: [{ uuid: 'node-1', name: 'Player', children: [] }] }),
        executeSceneScript: async (method, args) => ({ success: true, data: { method, args } }),
        querySceneAssets: async () => [{ name: 'Main', url: 'db://assets/Main.scene', uuid: 'scene-asset' }],
        queryAssetUuid: async () => 'scene-asset',
        openScene: async (uuid) => { sceneCalls.push(['openScene', uuid]); },
        saveScene: async () => { sceneCalls.push(['saveScene']); },
        createScene: async (request) => { sceneCalls.push(['createScene', request]); return { uuid: 'scene-asset', url: request.fullPath }; },
        openSaveAsDialog: async () => { sceneCalls.push(['saveAs']); },
        closeScene: async () => { sceneCalls.push(['closeScene']); }
    };

    const sceneTools = new SceneTools(fakeScene);
    const current = await sceneTools.execute('get_current_scene', {});
    assert.strictEqual(current.data.uuid, 'scene-1');

    const listed = await sceneTools.execute('get_scene_list', {});
    assert.strictEqual(listed.data[0].path, 'db://assets/Main.scene');

    const opened = await sceneTools.execute('open_scene', { scenePath: 'db://assets/Main.scene' });
    assert.strictEqual(opened.success, true);
    assert.deepStrictEqual(sceneCalls[0], ['openScene', 'scene-asset']);

    const createdScene = await sceneTools.execute('create_scene', { sceneName: 'Main', savePath: 'db://assets/scenes' });
    assert.strictEqual(createdScene.success, true);
    assert.strictEqual(sceneCalls.find((call) => call[0] === 'createScene')[1].fullPath, 'db://assets/scenes/Main.scene');

    const hierarchy = await sceneTools.execute('get_scene_hierarchy', { includeComponents: false });
    assert.strictEqual(hierarchy.data.children[0].name, 'Player');

    const stable = selectCocosAdapter('3.8.8');
    assert.strictEqual(stable.node.constructor.name, 'Creator38xNodeAdapter');
    assert.strictEqual(stable.scene.constructor.name, 'Creator38xSceneAdapter');

    const preview = selectCocosAdapter('3.9.0');
    await assert.rejects(() => preview.node.queryNodeTree(), /unavailable/);
    await assert.rejects(() => preview.scene.queryNodeTree(), /unavailable/);

    console.log('Node and scene adapter contract tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
