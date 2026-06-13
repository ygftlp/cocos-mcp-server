export interface PrefabAdapter {
    loadAsset(uuid: string): Promise<any>;
    createFromNode(nodeUuid: string, prefabPath: string): Promise<any>;
    apply(nodeUuid: string, prefabUuid: string): Promise<void>;
    revert(nodeUuid: string): Promise<void>;
    restoreNode(nodeUuid: string, assetUuid: string): Promise<void>;
}
