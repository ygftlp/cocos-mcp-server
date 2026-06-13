import { AssetAdapter, AssetMutationOptions } from '../contracts/asset-adapter';

export class Creator38xAssetAdapter implements AssetAdapter {
    async refreshAsset(url: string): Promise<void> {
        await (Editor.Message.request as any)('asset-db', 'refresh-asset', url);
    }

    importAsset(sourcePath: string, targetUrl: string, options: AssetMutationOptions = {}): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'import-asset', sourcePath, targetUrl, options);
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

    readAsset(url: string): Promise<string> {
        return (Editor.Message.request as any)('asset-db', 'read-asset', url);
    }

    saveAssetMeta(urlOrUuid: string, content: string): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'save-asset-meta', urlOrUuid, content);
    }

    generateAvailableUrl(url: string): Promise<string> {
        return (Editor.Message.request as any)('asset-db', 'generate-available-url', url);
    }

    async queryReady(): Promise<boolean> {
        return Boolean(await (Editor.Message.request as any)('asset-db', 'query-ready'));
    }

    async openAsset(urlOrUuid: string): Promise<void> {
        await (Editor.Message.request as any)('asset-db', 'open-asset', urlOrUuid);
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
