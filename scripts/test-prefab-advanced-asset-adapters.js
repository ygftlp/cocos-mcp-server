'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { selectCocosAdapter } = require('../dist/adapters/selector');
const { AssetAdvancedTools } = require('../dist/tools/asset-advanced-tools');
const { PrefabTools } = require('../dist/tools/prefab-tools');

function buildAdapter(root) {
    const calls = [];
    const assets = new Map([
        ['db://assets/ui/Button.prefab', { name: 'Button', uuid: 'prefab-1', url: 'db://assets/ui/Button.prefab', type: 'cc.Prefab', isDirectory: false, meta: { importer: 'prefab' } }],
        ['db://assets/good.json', { name: 'good', uuid: 'good-1', url: 'db://assets/good.json', type: 'cc.JsonAsset', isDirectory: false }]
    ]);
    const asset = {
        refreshAsset: async () => undefined,
        importAsset: async (source, target, options) => { calls.push(['import', source, target, options]); return { uuid: 'imported' }; },
        queryAssetInfo: async (url) => assets.get(url) || null,
        queryAssets: async (pattern) => pattern.includes('prefab') ? [assets.get('db://assets/ui/Button.prefab')] : [assets.get('db://assets/good.json'), { name: 'broken', uuid: 'bad-1', url: 'db://assets/missing.json', type: 'cc.JsonAsset', isDirectory: false }],
        createAsset: async () => ({}),
        copyAsset: async (source, target, options) => { calls.push(['copy', source, target, options]); return { source, target }; },
        moveAsset: async () => ({}),
        deleteAsset: async (url) => { calls.push(['delete', url]); if (url.includes('bad')) throw new Error('delete failed'); },
        saveAsset: async () => ({}),
        readAsset: async () => JSON.stringify([{ __type__: 'cc.Prefab' }]),
        saveAssetMeta: async (url, content) => { calls.push(['save-meta', url, content]); return { uuid: 'meta-1', url }; },
        generateAvailableUrl: async (url) => `${url}-1`,
        queryReady: async () => true,
        openAsset: async (url) => calls.push(['open', url]),
        reimportAsset: async () => undefined,
        queryPath: async () => root,
        queryUuid: async () => 'uuid',
        queryUrl: async () => 'db://assets/value'
    };
    const node = {
        queryAssetInfo: asset.queryAssetInfo,
        createNode: async (request) => { calls.push(['create-node', request]); return { uuid: 'instance-1' }; },
        queryNode: async () => null,
        queryNodeTree: async () => null,
        setNodeProperty: async (request) => calls.push(['set-node', request]),
        removeNode: async () => undefined,
        setNodeParent: async () => undefined,
        duplicateNode: async () => ({ uuid: 'copy' })
    };
    const prefab = {
        loadAsset: async (uuid) => ({ uuid, name: 'Button' }),
        createFromNode: async (nodeUuid, prefabPath) => { calls.push(['create-prefab', nodeUuid, prefabPath]); return { success: true }; },
        apply: async (nodeUuid, prefabUuid) => calls.push(['apply', nodeUuid, prefabUuid]),
        revert: async (nodeUuid) => calls.push(['revert', nodeUuid]),
        restoreNode: async (nodeUuid, assetUuid) => calls.push(['restore', nodeUuid, assetUuid])
    };
    const unavailable = async () => { throw new Error('unused'); };
    return {
        calls,
        profile: { adapterId: 'fake-38x', creatorVersion: '3.8.8', normalizedVersion: '3.8.8', versionRange: '>=3.8.6 <3.9.0', supportLevel: 'stable', writeEnabled: true, capabilities: {}, warnings: [] },
        asset,
        node,
        prefab,
        scene: { queryNodeTree: unavailable, executeSceneScript: unavailable, querySceneAssets: unavailable, queryAssetUuid: unavailable, openScene: unavailable, saveScene: unavailable, createScene: unavailable, openSaveAsDialog: unavailable, closeScene: unavailable },
        component: { createComponent: unavailable, removeComponent: unavailable, queryNode: unavailable, setSerializedProperty: unavailable },
        ui: { configureEvent: unavailable, listEvents: unavailable },
        build: { openPanel: unavailable, queryWorkerReady: unavailable, build: unavailable },
        project: { describe: () => ({ name: 'test', path: root, uuid: 'project', version: '1', cocosVersion: '3.8.8' }), queryConfig: unavailable },
        request: unavailable,
        send: () => undefined,
        openPanel: () => undefined
    };
}

async function main() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cocos-prefab-adapter-'));
    try {
        const adapter = buildAdapter(root);
        const prefabTools = new PrefabTools(adapter);

        const listed = await prefabTools.execute('get_prefab_list', { folder: 'db://assets/ui' });
        assert.strictEqual(listed.success, true);
        assert.strictEqual(listed.data[0].uuid, 'prefab-1');

        const instance = await prefabTools.execute('instantiate_prefab', {
            prefabPath: 'db://assets/ui/Button.prefab', parentUuid: 'canvas', position: { x: 10, y: 20, z: 0 }
        });
        assert.strictEqual(instance.data.nodeUuid, 'instance-1');
        assert.ok(adapter.calls.some((call) => call[0] === 'set-node' && call[1].path === 'position'));

        const valid = await prefabTools.execute('validate_prefab', { prefabPath: 'db://assets/ui/Button.prefab' });
        assert.strictEqual(valid.data.valid, true);

        const applied = await prefabTools.execute('update_prefab', { prefabPath: 'db://assets/ui/Button.prefab', nodeUuid: 'instance-1' });
        assert.strictEqual(applied.success, true);
        assert.ok(adapter.calls.some((call) => call[0] === 'apply'));

        const duplicated = await prefabTools.execute('duplicate_prefab', {
            sourcePath: 'db://assets/ui/Button.prefab', targetPath: 'db://assets/ui/ButtonCopy.prefab'
        });
        assert.strictEqual(duplicated.success, true);
        assert.ok(adapter.calls.some((call) => call[0] === 'copy' && call[3].rename === true));

        const sourceDir = path.join(root, 'incoming');
        fs.mkdirSync(sourceDir);
        fs.writeFileSync(path.join(sourceDir, 'a.png'), 'a');
        fs.writeFileSync(path.join(sourceDir, 'b.txt'), 'b');
        const advanced = new AssetAdvancedTools(adapter);
        const imported = await advanced.execute('batch_import_assets', {
            sourceDirectory: sourceDir,
            targetDirectory: 'db://assets/imported',
            fileFilter: ['.png'],
            overwrite: false
        });
        assert.strictEqual(imported.data.totalFiles, 1);
        assert.strictEqual(imported.data.successCount, 1);

        const deleted = await advanced.execute('batch_delete_assets', { urls: ['db://assets/good.json', 'db://assets/bad.json'] });
        assert.strictEqual(deleted.data.successCount, 1);
        assert.strictEqual(deleted.data.errorCount, 1);

        const references = await advanced.execute('validate_asset_references', { directory: 'db://assets' });
        assert.strictEqual(references.data.validReferences, 1);
        assert.strictEqual(references.data.brokenReferences, 1);

        const manifest = await advanced.execute('export_asset_manifest', { directory: 'db://assets', format: 'json', includeMetadata: true });
        assert.strictEqual(manifest.success, true);
        assert.strictEqual(manifest.data.assetCount, 2);

        const savedMeta = await advanced.execute('save_asset_meta', { urlOrUUID: 'good-1', content: '{}' });
        assert.strictEqual(savedMeta.success, true);
        const ready = await advanced.execute('query_asset_db_ready', {});
        assert.strictEqual(ready.data.ready, true);

        const stable = selectCocosAdapter('3.8.8');
        assert.strictEqual(stable.prefab.constructor.name, 'Creator38xPrefabAdapter');
        assert.strictEqual(typeof stable.asset.saveAssetMeta, 'function');

        const preview = selectCocosAdapter('3.9.0');
        await assert.rejects(() => preview.prefab.loadAsset('prefab'), /unavailable/);
        await assert.rejects(() => preview.asset.queryReady(), /unavailable/);

        console.log('Prefab and advanced asset adapter contract tests passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
