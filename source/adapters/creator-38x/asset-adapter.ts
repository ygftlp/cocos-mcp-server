import { AssetAdapter, AssetMutationOptions } from '../contracts/asset-adapter';

export class Creator38xAssetAdapter implements AssetAdapter {
    async refreshAsset(url: string): Promise<void> {
        await (Editor.Message.request as any)('asset-db', 'refresh-asset', url);
    }

    importAsset(sourcePath: string, targetUrl: string): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'import-asset', sourcePath, targetUrl);
    }

    queryAssetInfo(url: string): Promise<any | null> {
        return (Editor.Message.request as any)('asset-db', 'query-asset-info', url);
    }

    queryAssets(pattern: string): Promise<any[]> {
        return (Editor.Message.request as any)('asset-db', 'query-assets', { pattern });
    }

    createAsset(url: string, content: any, options: AssetMutationOptions = {}): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'create-asset', url, content, options);
    }

    copyAsset(source: string, target: string, options: AssetMutationOptions = {}): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'copy-asset', source, target, options);
    }

    moveAsset(source: string, target: string, options: AssetMutationOptions = {}): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'move-asset', source, target, options);
    }

    async deleteAsset(url: string): Promise<void> {
        await (Editor.Message.request as any)('asset-db', 'delete-asset', url);
    }

    saveAsset(url: string, content: string): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'save-asset', url, content);
    }

    async reimportAsset(url: string): Promise<void> {
        await (Editor.Message.request as any)('asset-db', 'reimport-asset', url);
    }

    queryPath(url: string): Promise<string | null> {
        return (Editor.Message.request as any)('asset-db', 'query-path', url);
    }

    queryUuid(url: string): Promise<string | null> {
        return (Editor.Message.request as any)('asset-db', 'query-uuid', url);
    }

    queryUrl(uuid: string): Promise<string | null> {
        return (Editor.Message.request as any)('asset-db', 'query-url', uuid);
    }
}
