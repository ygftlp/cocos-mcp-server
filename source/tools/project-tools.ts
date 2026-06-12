import { ToolDefinition, ToolResponse, ToolExecutor, ProjectInfo, AssetInfo } from '../types';
import * as fs from 'fs';
import * as path from 'path';
// Slim MCP project tool adapter: minimal project and asset-db operations.
export class ProjectTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'run_project':
                return await this.runProject(args?.platform);
            case 'build_project':
                return await this.buildProject(args);
            case 'get_project_info':
                return await this.getProjectInfo();
            case 'get_project_settings':
                return await this.getProjectSettings(args?.category);
            case 'refresh_assets':
                return await this.refreshAssets(args?.folder);
            case 'import_asset':
                return await this.importAsset(args?.sourcePath, args?.targetFolder);
            case 'get_asset_info':
                return await this.getAssetInfo(args?.assetPath);
            case 'get_assets':
                return await this.getAssets(args?.type, args?.folder);
            case 'get_build_settings':
                return await this.getBuildSettings();
            case 'open_build_panel':
                return await this.openBuildPanel();
            case 'check_builder_status':
                return await this.checkBuilderStatus();
            case 'start_preview_server':
                return await this.startPreviewServer(args?.port);
            case 'stop_preview_server':
                return await this.stopPreviewServer();
            case 'create_asset':
                return await this.createAsset(args?.url, args?.content, args?.overwrite);
            case 'copy_asset':
                return await this.copyAsset(args?.source, args?.target, args?.overwrite);
            case 'move_asset':
                return await this.moveAsset(args?.source, args?.target, args?.overwrite);
            case 'delete_asset':
                return await this.deleteAsset(args?.url);
            case 'save_asset':
                return await this.saveAsset(args?.url, args?.content);
            case 'reimport_asset':
                return await this.reimportAsset(args?.url);
            case 'query_asset_path':
                return await this.queryAssetPath(args?.url);
            case 'query_asset_uuid':
                return await this.queryAssetUuid(args?.url);
            case 'query_asset_url':
                return await this.queryAssetUrl(args?.uuid);
            case 'find_asset_by_name':
                return await this.findAssetByName(args);
            case 'get_asset_details':
                return await this.getAssetDetails(args?.assetPath, args?.includeSubAssets);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    // Open build panel only (no automated preview run).

    private async runProject(platform: string = 'browser'): Promise<ToolResponse> {
        try {
            await Editor.Message.request('builder', 'open');
            return { success: true, message: `Build panel opened for ${platform}` };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    // Open build panel only (no automated build).

    private async buildProject(args: any): Promise<ToolResponse> {
        try {
            await Editor.Message.request('builder', 'open');
            return {
                success: true,
                data: { platform: args?.platform || 'unknown' },
                message: 'Build panel opened. Configure build manually.'
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
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
            const config = await Editor.Message.request('project', 'query-config', 'project');
            return { success: true, data: { ...info, config } };
        } catch {
            return { success: true, data: info };
        }
    }

    private async getProjectSettings(category: string = 'general'): Promise<ToolResponse> {
        const configMap: Record<string, string> = {
            general: 'project',
            physics: 'physics',
            render: 'render',
            assets: 'asset-db'
        };
        const configName = configMap[category] || 'project';
        try {
            const settings = await Editor.Message.request('project', 'query-config', configName);
            return { success: true, data: { category, config: settings } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async refreshAssets(folder?: string): Promise<ToolResponse> {
        const targetPath = folder || 'db://assets';
        try {
            await Editor.Message.request('asset-db', 'refresh-asset', targetPath);
            return { success: true, data: { folder: targetPath } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async importAsset(sourcePath: string, targetFolder: string): Promise<ToolResponse> {
        if (!sourcePath || !targetFolder) {
            return { success: false, error: 'Missing sourcePath or targetFolder' };
        }
        if (!fs.existsSync(sourcePath)) {
            return { success: false, error: 'Source file not found' };
        }
        const fileName = path.basename(sourcePath);
        const targetPath = targetFolder.startsWith('db://') ? targetFolder : `db://assets/${targetFolder}`;
        try {
            const result = await Editor.Message.request('asset-db', 'import-asset', sourcePath, `${targetPath}/${fileName}`);
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getAssetInfo(assetPath: string): Promise<ToolResponse> {
        if (!assetPath) {
            return { success: false, error: 'Missing assetPath' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
            if (!assetInfo) {
                return { success: false, error: 'Asset not found' };
            }
            const info: AssetInfo = {
                name: assetInfo.name,
                uuid: assetInfo.uuid,
                path: assetInfo.url,
                type: assetInfo.type,
                size: assetInfo.size,
                isDirectory: assetInfo.isDirectory
            };
            if (assetInfo.meta) {
                info.meta = { ver: assetInfo.meta.ver, importer: assetInfo.meta.importer };
            }
            return { success: true, data: info };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getAssets(type: string = 'all', folder: string = 'db://assets'): Promise<ToolResponse> {
        let pattern = `${folder}/**/*`;
        if (type && type !== 'all') {
            const typeExtensions: Record<string, string> = {
                scene: '.scene',
                prefab: '.prefab',
                script: '.{ts,js}',
                texture: '.{png,jpg,jpeg,gif,tga,bmp,psd}',
                material: '.mtl',
                mesh: '.{fbx,obj,dae}',
                audio: '.{mp3,ogg,wav,m4a}',
                animation: '.{anim,clip}'
            };
            const extension = typeExtensions[type];
            if (extension) {
                pattern = `${folder}/**/*${extension}`;
            }
        }
        try {
            const results = await Editor.Message.request('asset-db', 'query-assets', { pattern });
            const assets = results.map((asset: any) => ({
                name: asset.name,
                uuid: asset.uuid,
                path: asset.url,
                type: asset.type,
                size: asset.size || 0,
                isDirectory: asset.isDirectory || false
            }));
            return { success: true, data: { type, folder, count: assets.length, assets } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getBuildSettings(): Promise<ToolResponse> {
        try {
            const ready = await Editor.Message.request('builder', 'query-worker-ready');
            return { success: true, data: { builderReady: ready } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async openBuildPanel(): Promise<ToolResponse> {
        try {
            await Editor.Message.request('builder', 'open');
            return { success: true, message: 'Build panel opened' };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async checkBuilderStatus(): Promise<ToolResponse> {
        try {
            const ready = await Editor.Message.request('builder', 'query-worker-ready');
            return { success: true, data: { ready } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async startPreviewServer(_port: number = 7456): Promise<ToolResponse> {
        return { success: false, error: 'Preview server control is not supported through MCP API' };
    }

    private async stopPreviewServer(): Promise<ToolResponse> {
        return { success: false, error: 'Preview server control is not supported through MCP API' };
    }

    private async createAsset(url: string, content: string | null = null, overwrite: boolean = false): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        const options = { overwrite: overwrite, rename: !overwrite };
        try {
            const result = await Editor.Message.request('asset-db', 'create-asset', url, content, options);
            return { success: true, data: result || { url } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async copyAsset(source: string, target: string, overwrite: boolean = false): Promise<ToolResponse> {
        if (!source || !target) {
            return { success: false, error: 'Missing source or target' };
        }
        const options = { overwrite: overwrite, rename: !overwrite };
        try {
            const result = await Editor.Message.request('asset-db', 'copy-asset', source, target, options);
            return { success: true, data: result || { source, target } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async moveAsset(source: string, target: string, overwrite: boolean = false): Promise<ToolResponse> {
        if (!source || !target) {
            return { success: false, error: 'Missing source or target' };
        }
        const options = { overwrite: overwrite, rename: !overwrite };
        try {
            const result = await Editor.Message.request('asset-db', 'move-asset', source, target, options);
            return { success: true, data: result || { source, target } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async deleteAsset(url: string): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        try {
            await Editor.Message.request('asset-db', 'delete-asset', url);
            return { success: true, data: { url } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async saveAsset(url: string, content: string): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        try {
            const result = await Editor.Message.request('asset-db', 'save-asset', url, content);
            return { success: true, data: result || { url } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async reimportAsset(url: string): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        try {
            await Editor.Message.request('asset-db', 'reimport-asset', url);
            return { success: true, data: { url } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async queryAssetPath(url: string): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        try {
            const result = await Editor.Message.request('asset-db', 'query-path', url);
            return { success: true, data: { url, path: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async queryAssetUuid(url: string): Promise<ToolResponse> {
        if (!url) {
            return { success: false, error: 'Missing url' };
        }
        try {
            const result = await Editor.Message.request('asset-db', 'query-uuid', url);
            return { success: true, data: { url, uuid: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async queryAssetUrl(uuid: string): Promise<ToolResponse> {
        if (!uuid) {
            return { success: false, error: 'Missing uuid' };
        }
        try {
            const result = await Editor.Message.request('asset-db', 'query-url', uuid);
            return { success: true, data: { uuid, url: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async findAssetByName(args: any): Promise<ToolResponse> {
        const name = args?.name;
        const folder = args?.folder || 'db://assets';
        if (!name) {
            return { success: false, error: 'Missing name' };
        }
        try {
            const results = await Editor.Message.request('asset-db', 'query-assets', {
                pattern: `${folder}/**/${name}.*`
            });
            return { success: true, data: results || [] };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getAssetDetails(assetPath: string, includeSubAssets: boolean = false): Promise<ToolResponse> {
        if (!assetPath) {
            return { success: false, error: 'Missing assetPath' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', assetPath);
            if (!assetInfo) {
                return { success: false, error: 'Asset not found' };
            }
            const result: any = { assetInfo };
            if (includeSubAssets && assetInfo.subAssets) {
                result.subAssets = assetInfo.subAssets;
            }
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }
}
