'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { selectCocosAdapter } = require('../dist/adapters/selector');
const { SceneAdvancedTools } = require('../dist/tools/scene-advanced-tools');

async function main() {
    const calls = [];
    const fake = {
        resetProperty: async (uuid, propertyPath) => calls.push(['resetProperty', uuid, propertyPath]),
        moveArrayElement: async (request) => calls.push(['moveArrayElement', request]),
        removeArrayElement: async (request) => calls.push(['removeArrayElement', request]),
        copyNode: async (uuids) => { calls.push(['copyNode', uuids]); return ['copy-1']; },
        pasteNode: async (request) => { calls.push(['pasteNode', request]); return ['paste-1']; },
        cutNode: async (uuids) => { calls.push(['cutNode', uuids]); return ['cut-1']; },
        resetNode: async (uuid) => calls.push(['resetNode', uuid]),
        resetComponent: async (uuid) => calls.push(['resetComponent', uuid]),
        restorePrefab: async (nodeUuid, assetUuid) => calls.push(['restorePrefab', nodeUuid, assetUuid]),
        executeComponentMethod: async (uuid, name, args) => { calls.push(['executeComponentMethod', uuid, name, args]); return 42; },
        executeSceneScript: async (name, method, args) => { calls.push(['executeSceneScript', name, method, args]); return { ok: true }; },
        snapshot: async () => calls.push(['snapshot']),
        abortSnapshot: async () => calls.push(['abortSnapshot']),
        beginRecording: async (nodeUuid) => { calls.push(['beginRecording', nodeUuid]); return 'undo-1'; },
        endRecording: async (undoId) => calls.push(['endRecording', undoId]),
        cancelRecording: async (undoId) => calls.push(['cancelRecording', undoId]),
        softReload: async () => calls.push(['softReload']),
        queryReady: async () => true,
        queryDirty: async () => false,
        queryClasses: async (extendsClass) => [{ name: 'Player', extendsClass }],
        queryComponents: async () => ['cc.Sprite', 'Player'],
        queryComponentHasScript: async (className) => className === 'Player',
        queryNodesByAssetUuid: async (assetUuid) => [`node-for-${assetUuid}`]
    };

    const tools = new SceneAdvancedTools(fake);

    assert.strictEqual((await tools.execute('reset_node_property', { uuid: 'node-1', path: 'position' })).success, true);
    assert.deepStrictEqual(calls[0], ['resetProperty', 'node-1', 'position']);

    const moved = await tools.execute('move_array_element', { uuid: 'node-1', path: 'items', target: 2, offset: -1 });
    assert.strictEqual(moved.success, true);
    assert.deepStrictEqual(calls[1], ['moveArrayElement', { uuid: 'node-1', path: 'items', target: 2, offset: -1 }]);

    const invalidMove = await tools.execute('move_array_element', { uuid: 'node-1', path: 'items', target: 1.5, offset: 1 });
    assert.strictEqual(invalidMove.success, false);

    const removed = await tools.execute('remove_array_element', { uuid: 'node-1', path: 'items', index: 0 });
    assert.strictEqual(removed.success, true);
    const invalidRemove = await tools.execute('remove_array_element', { uuid: 'node-1', path: 'items', index: -1 });
    assert.strictEqual(invalidRemove.success, false);

    assert.deepStrictEqual((await tools.execute('copy_node', { uuids: ['a'] })).data.copiedUuids, ['copy-1']);
    assert.deepStrictEqual((await tools.execute('paste_node', { target: 'root', uuids: ['a'], keepWorldTransform: true })).data.newUuids, ['paste-1']);
    assert.deepStrictEqual((await tools.execute('cut_node', { uuids: ['a'] })).data.cutUuids, ['cut-1']);

    assert.strictEqual((await tools.execute('reset_node_transform', { uuid: 'node-1' })).success, true);
    assert.strictEqual((await tools.execute('reset_component', { uuid: 'component-1' })).success, true);
    assert.strictEqual((await tools.execute('restore_prefab', { nodeUuid: 'node-1', assetUuid: 'prefab-1' })).success, true);

    const componentResult = await tools.execute('execute_component_method', { uuid: 'component-1', name: 'run', args: [1] });
    assert.strictEqual(componentResult.data.result, 42);
    const scriptResult = await tools.execute('execute_scene_script', { name: 'extension', method: 'inspect', args: [] });
    assert.deepStrictEqual(scriptResult.data, { ok: true });

    assert.strictEqual((await tools.execute('scene_snapshot', {})).success, true);
    assert.strictEqual((await tools.execute('scene_snapshot_abort', {})).success, true);
    const begin = await tools.execute('begin_undo_recording', { nodeUuid: 'node-1' });
    assert.strictEqual(begin.data.undoId, 'undo-1');
    assert.strictEqual((await tools.execute('end_undo_recording', { undoId: 'undo-1' })).success, true);
    assert.strictEqual((await tools.execute('cancel_undo_recording', { undoId: 'undo-2' })).success, true);
    assert.strictEqual((await tools.execute('soft_reload_scene', {})).success, true);

    assert.strictEqual((await tools.execute('query_scene_ready', {})).data.ready, true);
    assert.strictEqual((await tools.execute('query_scene_dirty', {})).data.dirty, false);
    assert.strictEqual((await tools.execute('query_scene_classes', { extends: 'cc.Component' })).data.classes[0].extendsClass, 'cc.Component');
    assert.deepStrictEqual((await tools.execute('query_scene_components', {})).data.components, ['cc.Sprite', 'Player']);
    assert.strictEqual((await tools.execute('query_component_has_script', { className: 'Player' })).data.hasScript, true);
    assert.deepStrictEqual((await tools.execute('query_nodes_by_asset_uuid', { assetUuid: 'asset-1' })).data.nodeUuids, ['node-for-asset-1']);

    const source = fs.readFileSync(path.join(__dirname, '..', 'source', 'tools', 'scene-advanced-tools.ts'), 'utf8');
    assert.strictEqual(source.includes('Editor.Message'), false, 'SceneAdvancedTools must not call Editor.Message directly');

    const stable = selectCocosAdapter('3.8.8');
    assert.strictEqual(stable.sceneAdvanced.constructor.name, 'Creator38xSceneAdvancedAdapter');

    const preview = selectCocosAdapter('3.9.0');
    await assert.rejects(() => preview.sceneAdvanced.queryReady(), /unavailable/);
    await assert.rejects(() => preview.sceneAdvanced.copyNode(['node-1']), /unavailable/);

    console.log('Advanced scene adapter contract tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
