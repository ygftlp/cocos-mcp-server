export interface AssetMutationOptions {
    overwrite?: boolean;
    rename?: boolean;
}

/** Version-specific bridge for the Cocos Asset Database. */
export interface AssetAdapter {
    refreshAsset(url: string): Promise<void>;
    importAsset(sourcePath: string, targetUrl: string): Promise<any>;
    queryAssetInfo(url: string): Promise<any | null>;
    queryAssets(pattern: string): Promise<any[]>;
    createAsset(url: string, content: any, options?: AssetMutationOptions): Promise<any>;
    copyAsset(source: string, target: string, options?: AssetMutationOptions): Promise<any>;
    moveAsset(source: string, target: string, options?: AssetMutationOptions): Promise<any>;
    deleteAsset(url: string): Promise<void>;
    saveAsset(url: string, content: string): Promise<any>;
    reimportAsset(url: string): Promise<void>;
    queryPath(url: string): Promise<string | null>;
    queryUuid(url: string): Promise<string | null>;
    queryUrl(uuid: string): Promise<string | null>;
}
