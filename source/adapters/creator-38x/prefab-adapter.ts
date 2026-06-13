import { PrefabAdapter } from '../contracts/prefab-adapter';

export class Creator38xPrefabAdapter implements PrefabAdapter {
    loadAsset(uuid: string): Promise<any> {
        return (Editor.Message.request as any)('scene', 'load-asset', { uuid });
    }

    createFromNode(nodeUuid: string, prefabPath: string): Promise<any> {
        return (Editor.Message.request as any)('scene', 'execute-scene-script', {
            name: 'cocos-mcp-server',
            method: 'createPrefabFromNode',
            args: [nodeUuid, prefabPath]
        });
    }

    async apply(nodeUuid: string, prefabUuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'apply-prefab', {
            node: nodeUuid,
            prefab: prefabUuid
        });
    }

    async revert(nodeUuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'revert-prefab', { uuid: nodeUuid });
    }

    async restoreNode(nodeUuid: string, assetUuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid);
    }
}
