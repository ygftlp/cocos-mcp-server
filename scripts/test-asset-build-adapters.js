'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { selectCocosAdapter } = require('../dist/adapters/selector');
const { ProjectTools } = require('../dist/tools/project-tools');
const { EnhancedProjectTools } = require('../dist/tools/enhanced-project-tools');
const { GameProjectTools } = require('../dist/tools/game-project-tools');

function fakeAdapter(projectPath, overrides = {}) {
    const calls = [];
    const asset = {
        refreshAsset: async (url) => calls.push(['refresh', url]),
        importAsset: async (source, target) => ({ source, target }),
        queryAssetInfo: async (url) => url.includes('missing') ? null : ({ name: 'Main', uuid: 'asset-1', url, type: 'cc.SceneAsset', isDirectory: false }),
        queryAssets: async (pattern) => [{ name: 'Main', uuid: 'asset-1', url: 'db://assets/Main.scene', type: 'cc.SceneAsset', isDirectory: false, pattern }],
        createAsset: async (url, content, options) => { calls.push(['create', url, content, options]); return { uuid: 'asset-1', url }; },
        copyAsset: async (source, target, options) => { calls.push(['copy', source, target, options]); return { source, target }; },
        moveAsset: async (source, target, options) => { calls.push(['move', source, target, options]); return { source, target }; },
        deleteAsset: async (url) => calls.push(['delete', url]),
        saveAsset: async (url, content) => ({ url, content }),
        reimportAsset: async (url) => calls.push(['reimport', url]),
        queryPath: async () => path.join(projectPath, 'assets', 'Main.scene'),
        queryUuid: async () => 'asset-1',
        queryUrl: async () => 'db://assets/Main.scene'
    };
    const build = {
        openPanel: async () => calls.push(['open-build']),
        queryWorkerReady: async () => true,
        build: async (options) => { calls.push(['build', options]); return { taskId: 'build-1' }; }
    };
    const project = {
        describe: () => ({ name: 'CommercialGame', path: projectPath, uuid: 'project-1', version: '1.0.0', creatorVersion: '3.8.8' }),
        queryConfig: async (name) => ({ name, enabled: true })
    };
    const unavailable = async () => { throw new Error('unused domain'); };
    return {
        calls,
        profile: { adapterId: 'fake-38x', creatorVersion: '3.8.8', normalizedVersion: '3.8.8', versionRange: '>=3.8.6 <3.9.0', supportLevel: 'stable', writeEnabled: true, capabilities: {}, warnings: [] },
        asset: { ...asset, ...(overrides.asset || {}) },
        build: { ...build, ...(overrides.build || {}) },
        project: { ...project, ...(overrides.project || {}) },
        node: { queryAssetInfo: unavailable, createNode: unavailable, queryNode: unavailable, queryNodeTree: unavailable, setNodeProperty: unavailable, removeNode: unavailable, setNodeParent: unavailable, duplicateNode: unavailable },
        scene: { queryNodeTree: unavailable, executeSceneScript: unavailable, querySceneAssets: unavailable, queryAssetUuid: unavailable, openScene: unavailable, saveScene: unavailable, createScene: unavailable, openSaveAsDialog: unavailable, closeScene: unavailable },
        component: { createComponent: unavailable, removeComponent: unavailable, queryNode: unavailable, setSerializedProperty: unavailable },
        ui: { configureEvent: unavailable, listEvents: unavailable },
        request: unavailable,
        send: () => undefined,
        openPanel: () => undefined
    };
}

async function main() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cocos-mcp-adapter-'));
    fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
    try {
        const adapter = fakeAdapter(root);
        const projectTools = new ProjectTools(adapter);

        const info = await projectTools.execute('get_project_info', {});
        assert.strictEqual(info.success, true);
        assert.strictEqual(info.data.name, 'CommercialGame');
        assert.strictEqual(info.data.config.name, 'project');

        const created = await projectTools.execute('create_asset', { url: 'db://assets/data.json', content: '{}', overwrite: true });
        assert.strictEqual(created.success, true);
        assert.deepStrictEqual(adapter.calls[0], ['create', 'db://assets/data.json', '{}', { overwrite: true, rename: false }]);

        const listed = await projectTools.execute('get_assets', { type: 'scene', folder: 'db://assets' });
        assert.strictEqual(listed.data.count, 1);
        assert.strictEqual(listed.data.assets[0].uuid, 'asset-1');

        const copied = await projectTools.execute('copy_asset', { source: 'db://assets/a', target: 'db://assets/b', overwrite: false });
        assert.strictEqual(copied.success, true);
        assert.ok(adapter.calls.some((call) => call[0] === 'copy' && call[3].rename === true));

        const status = await projectTools.execute('get_build_settings', {});
        assert.strictEqual(status.data.ready, true);

        const enhanced = new EnhancedProjectTools(adapter);
        const preview = await enhanced.execute('quick_start_project', { template: '2d', root: 'assets/game', dryRun: true });
        assert.strictEqual(preview.success, true);
        assert.strictEqual(preview.data.root, 'assets/game');
        assert.ok(preview.data.created.includes('assets/game/scripts/core/GameConfig.ts'));

        const build = await enhanced.execute('build_project', { platform: 'web-desktop', mode: 'editor' });
        assert.strictEqual(build.success, true);
        assert.strictEqual(build.data.result.taskId, 'build-1');
        assert.ok(adapter.calls.some((call) => call[0] === 'build' && call[1].platform === 'web-desktop'));

        const blockedAdapter = fakeAdapter(root, {
            build: {
                queryWorkerReady: async () => false,
                build: async () => { throw new Error('must not run'); }
            }
        });
        const blocked = await new EnhancedProjectTools(blockedAdapter).execute('build_project', {
            platform: 'web-desktop', mode: 'editor', fallbackOpenPanel: false
        });
        assert.strictEqual(blocked.success, false);
        assert.ok(blocked.error.includes('not ready'));

        const gamePreview = await new GameProjectTools(adapter).execute('create_game', {
            template: 'arcade-clicker-2d', dryRun: true
        });
        assert.strictEqual(gamePreview.success, true);
        assert.strictEqual(gamePreview.data.projectName, 'CommercialGame');

        const stable = selectCocosAdapter('3.8.8');
        assert.strictEqual(stable.asset.constructor.name, 'Creator38xAssetAdapter');
        assert.strictEqual(stable.build.constructor.name, 'Creator38xBuildAdapter');
        assert.strictEqual(stable.project.constructor.name, 'Creator38xProjectAdapter');

        const previewAdapter = selectCocosAdapter('3.9.0');
        await assert.rejects(() => previewAdapter.asset.queryAssets('db://assets/**'), /unavailable/);
        await assert.rejects(() => previewAdapter.build.queryWorkerReady(), /unavailable/);
        assert.throws(() => previewAdapter.project.describe(), /unavailable/);

        console.log('Asset, build, and project adapter contract tests passed.');
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
