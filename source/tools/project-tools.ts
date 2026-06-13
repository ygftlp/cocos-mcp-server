import { ToolDefinition, ToolResponse, ToolExecutor, ProjectInfo, AssetInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectTools implements ToolExecutor {
    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const a = args || {};
        switch (toolName) {
            case 'run_project':
            case 'build_project':
            case 'open_build_panel': return this.openBuildPanel(a.platform);
            case 'get_project_info': return this.getProjectInfo();
            case 'get_project_settings': return this.getProjectSettings(a.category);
            case 'refresh_assets': return this.refreshAssets(a.folder);
            case 'import_asset': return this.importAsset(a.sourcePath, a.targetFolder);
            case 'get_asset_info': return this.getAssetInfo(a.assetPath);
            case 'get_assets': return this.getAssets(a.type, a.folder);
            case 'get_build_settings':
            case 'check_builder_status': return this.getBuildSettings();
            case 'start_preview_server':
            case 'stop_preview_server': return { success: false, error: 'Preview server control is not supported through MCP API' };
            case 'create_asset': return this.createAsset(a.url, a.content, a.overwrite);
            case 'copy_asset': return this.copyOrMove('copy-asset', a.source, a.target, a.overwrite);
            case 'move_asset': return this.copyOrMove('move-asset', a.source, a.target, a.overwrite);
            case 'delete_asset': return this.deleteAsset(a.url);
            case 'save_asset': return this.saveAsset(a.url, a.content);
            case 'reimport_asset': return this.reimportAsset(a.url);
            case 'query_asset_path': return this.queryAsset('query-path', 'path', a.url);
            case 'query_asset_uuid': return this.queryAsset('query-uuid', 'uuid', a.url);
            case 'query_asset_url': return this.queryAsset('query-url', 'url', a.uuid);
            case 'find_asset_by_name': return this.findAssetByName(a);
            case 'get_asset_details': return this.getAssetDetails(a.assetPath, a.includeSubAssets);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private request(channel: string, message: string, ...args: any[]): Promise<any> {
        return (Editor.Message.request as any)(channel, message, ...args);
    }

    private fail(error: any): ToolResponse {
        return { success: false, error: error?.message || String(error) };
    }

    private async openBuildPanel(platform = 'browser'): Promise<ToolResponse> {
        try {
            await this.request('builder', 'open');
            return { success: true, data: { platform }, message: 'Build panel opened' };
        } catch (error: any) { return this.fail(error); }
    }

    private async getProjectInfo(): Promise<ToolResponse> {
        const info: ProjectInfo = {
            name: Editor.Project.name,
            path: Editor.Project.path,
            uuid: Editor.Project.uuid,
            version: (Editor.Project as any).version || '1.0.0',
            cocosVersion: (Editor as any).versions?.cocos || 'Unknown'
        };
        try {
            return { success: true, data: { ...info, config: await this.request('project', 'query-config', 'project') } };
        } catch { return { success: true, data: info }; }
    }

    private async getProjectSettings(category = 'general'): Promise<ToolResponse> {
        const configs: Record<string, string> = { general: 'project', physics: 'physics', render: 'render', assets: 'asset-db' };
        try {
            return { success: true, data: { category, config: await this.request('project', 'query-config', configs[category] || 'project') } };
        } catch (error: any) { return this.fail(error); }
    }

    private async refreshAssets(folder = 'db://assets'): Promise<ToolResponse> {
        try {
            await this.request('asset-db', 'refresh-asset', folder || 'db://assets');
            return { success: true, data: { folder: folder || 'db://assets' } };
        } catch (error: any) { return this.fail(error); }
    }

    private async importAsset(sourcePath: string, targetFolder: string): Promise<ToolResponse> {
        if (!sourcePath || !targetFolder) return { success: false, error: 'Missing sourcePath or targetFolder' };
        if (!fs.existsSync(sourcePath)) return { success: false, error: 'Source file not found' };
        const folder = targetFolder.startsWith('db://')
            ? targetFolder.replace(/\/$/, '')
            : `db://assets/${targetFolder.replace(/^\/|\/$/g, '')}`;
        try {
            return { success: true, data: await this.request('asset-db', 'import-asset', sourcePath, `${folder}/${path.basename(sourcePath)}`) };
        } catch (error: any) { return this.fail(error); }
    }

    private normalizeAsset(asset: any): AssetInfo {
        return {
            name: String(asset?.name || ''),
            uuid: String(asset?.uuid || ''),
            path: String(asset?.url || asset?.path || ''),
            type: String(asset?.type || 'unknown'),
            size: typeof asset?.size === 'number' ? asset.size : undefined,
            isDirectory: Boolean(asset?.isDirectory),
            ...(asset?.meta ? { meta: { ver: String(asset.meta.ver || ''), importer: String(asset.meta.importer || '') } } : {})
        };
    }

    private async getAssetInfo(assetPath: string): Promise<ToolResponse> {
        if (!assetPath) return { success: false, error: 'Missing assetPath' };
        try {
            const asset: any = await this.request('asset-db', 'query-asset-info', assetPath);
            return asset ? { success: true, data: this.normalizeAsset(asset) } : { success: false, error: 'Asset not found' };
        } catch (error: any) { return this.fail(error); }
    }

    private async getAssets(type = 'all', folder = 'db://assets'): Promise<ToolResponse> {
        const extensions: Record<string, string> = {
            scene: '.scene', prefab: '.prefab', script: '.{ts,js}', texture: '.{png,jpg,jpeg,gif,tga,bmp,psd}',
            material: '.mtl', mesh: '.{fbx,obj,dae}', audio: '.{mp3,ogg,wav,m4a}', animation: '.{anim,clip}'
        };
        try {
            const assets = ((await this.request('asset-db', 'query-assets', {
                pattern: `${folder}/**/*${type !== 'all' ? extensions[type] || '' : ''}`
            })) || []).map((asset: any) => this.normalizeAsset(asset));
            return { success: true, data: { type, folder, count: assets.length, assets } };
        } catch (error: any) { return this.fail(error); }
    }

    private async getBuildSettings(): Promise<ToolResponse> {
        try {
            return { success: true, data: { ready: await this.request('builder', 'query-worker-ready') } };
        } catch (error: any) { return this.fail(error); }
    }

    private async createAsset(url: string, content: any = null, overwrite = false): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            const result = await this.request('asset-db', 'create-asset', url, content, { overwrite, rename: !overwrite });
            return { success: true, data: result || { url } };
        } catch (error: any) { return this.fail(error); }
    }

    private async copyOrMove(operation: string, source: string, target: string, overwrite = false): Promise<ToolResponse> {
        if (!source || !target) return { success: false, error: 'Missing source or target' };
        try {
            const result = await this.request('asset-db', operation, source, target, { overwrite, rename: !overwrite });
            return { success: true, data: result || { source, target } };
        } catch (error: any) { return this.fail(error); }
    }

    private async deleteAsset(url: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            await this.request('asset-db', 'delete-asset', url);
            return { success: true, data: { url } };
        } catch (error: any) { return this.fail(error); }
    }

    private async saveAsset(url: string, content: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            const result = await this.request('asset-db', 'save-asset', url, content);
            return { success: true, data: result || { url } };
        } catch (error: any) { return this.fail(error); }
    }

    private async reimportAsset(url: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            await this.request('asset-db', 'reimport-asset', url);
            return { success: true, data: { url } };
        } catch (error: any) { return this.fail(error); }
    }

    private async queryAsset(message: string, key: string, value: string): Promise<ToolResponse> {
        if (!value) return { success: false, error: `Missing ${key === 'url' ? 'uuid' : 'url'}` };
        try {
            return { success: true, data: { [key === 'url' ? 'uuid' : 'url']: value, [key]: await this.request('asset-db', message, value) } };
        } catch (error: any) { return this.fail(error); }
    }

    private async findAssetByName(args: any): Promise<ToolResponse> {
        if (!args.name) return { success: false, error: 'Missing name' };
        try {
            return {
                success: true,
                data: await this.request('asset-db', 'query-assets', { pattern: `${args.folder || 'db://assets'}/**/${args.name}.*` }) || []
            };
        } catch (error: any) { return this.fail(error); }
    }

    private async getAssetDetails(assetPath: string, includeSubAssets = false): Promise<ToolResponse> {
        if (!assetPath) return { success: false, error: 'Missing assetPath' };
        try {
            const asset: any = await this.request('asset-db', 'query-asset-info', assetPath);
            if (!asset) return { success: false, error: 'Asset not found' };
            return {
                success: true,
                data: {
                    assetInfo: this.normalizeAsset(asset),
                    ...(includeSubAssets && asset.subAssets ? { subAssets: asset.subAssets } : {})
                }
            };
        } catch (error: any) { return this.fail(error); }
    }
}
