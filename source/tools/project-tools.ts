import * as fs from 'fs';
import * as path from 'path';
import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { AssetInfo, ProjectInfo, ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class ProjectTools implements ToolExecutor {
    constructor(private readonly adapter: CocosAdapter = selectCocosAdapter()) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        const input = args || {};
        switch (toolName) {
            case 'run_project':
            case 'build_project':
            case 'open_build_panel': return this.openBuildPanel(input.platform);
            case 'get_project_info': return this.getProjectInfo();
            case 'get_project_settings': return this.getProjectSettings(input.category);
            case 'refresh_assets': return this.refreshAssets(input.folder);
            case 'import_asset': return this.importAsset(input.sourcePath, input.targetFolder);
            case 'get_asset_info': return this.getAssetInfo(input.assetPath);
            case 'get_assets': return this.getAssets(input.type, input.folder);
            case 'get_build_settings':
            case 'check_builder_status': return this.getBuildSettings();
            case 'start_preview_server':
            case 'stop_preview_server': return { success: false, error: 'Preview server control is not supported through MCP API' };
            case 'create_asset': return this.createAsset(input.url, input.content, input.overwrite);
            case 'copy_asset': return this.copyOrMove('copy', input.source, input.target, input.overwrite);
            case 'move_asset': return this.copyOrMove('move', input.source, input.target, input.overwrite);
            case 'delete_asset': return this.deleteAsset(input.url);
            case 'save_asset': return this.saveAsset(input.url, input.content);
            case 'reimport_asset': return this.reimportAsset(input.url);
            case 'query_asset_path': return this.queryAsset('path', input.url);
            case 'query_asset_uuid': return this.queryAsset('uuid', input.url);
            case 'query_asset_url': return this.queryAsset('url', input.uuid);
            case 'find_asset_by_name': return this.findAssetByName(input);
            case 'get_asset_details': return this.getAssetDetails(input.assetPath, input.includeSubAssets);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private failure(error: any): ToolResponse {
        return { success: false, error: error?.message || String(error) };
    }

    private async openBuildPanel(platform = 'browser'): Promise<ToolResponse> {
        try {
            await this.adapter.build.openPanel();
            return { success: true, data: { platform }, message: 'Build panel opened' };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async getProjectInfo(): Promise<ToolResponse> {
        let descriptor: ProjectInfo;
        try {
            descriptor = this.adapter.project.describe();
        } catch (error: any) {
            return this.failure(error);
        }
        try {
            const config = await this.adapter.project.queryConfig('project');
            return { success: true, data: { ...descriptor, config } };
        } catch {
            return { success: true, data: descriptor };
        }
    }

    private async getProjectSettings(category = 'general'): Promise<ToolResponse> {
        const configs: Record<string, string> = {
            general: 'project', physics: 'physics', render: 'render', assets: 'asset-db'
        };
        try {
            return {
                success: true,
                data: { category, config: await this.adapter.project.queryConfig(configs[category] || 'project') }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async refreshAssets(folder = 'db://assets'): Promise<ToolResponse> {
        const target = folder || 'db://assets';
        try {
            await this.adapter.asset.refreshAsset(target);
            return { success: true, data: { folder: target } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async importAsset(sourcePath: string, targetFolder: string): Promise<ToolResponse> {
        if (!sourcePath || !targetFolder) return { success: false, error: 'Missing sourcePath or targetFolder' };
        if (!fs.existsSync(sourcePath)) return { success: false, error: 'Source file not found' };
        const folder = targetFolder.startsWith('db://')
            ? targetFolder.replace(/\/$/, '')
            : `db://assets/${targetFolder.replace(/^\/|\/$/g, '')}`;
        try {
            return {
                success: true,
                data: await this.adapter.asset.importAsset(sourcePath, `${folder}/${path.basename(sourcePath)}`)
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private normalizeAsset(asset: any): AssetInfo {
        return {
            name: String(asset?.name || ''),
            uuid: String(asset?.uuid || ''),
            path: String(asset?.url || asset?.path || ''),
            type: String(asset?.type || 'unknown'),
            size: typeof asset?.size === 'number' ? asset.size : undefined,
            isDirectory: Boolean(asset?.isDirectory),
            ...(asset?.meta ? {
                meta: {
                    ver: String(asset.meta.ver || ''),
                    importer: String(asset.meta.importer || '')
                }
            } : {})
        };
    }

    private async getAssetInfo(assetPath: string): Promise<ToolResponse> {
        if (!assetPath) return { success: false, error: 'Missing assetPath' };
        try {
            const asset = await this.adapter.asset.queryAssetInfo(assetPath);
            return asset
                ? { success: true, data: this.normalizeAsset(asset) }
                : { success: false, error: 'Asset not found' };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async getAssets(type = 'all', folder = 'db://assets'): Promise<ToolResponse> {
        const extensions: Record<string, string> = {
            scene: '.scene', prefab: '.prefab', script: '.{ts,js}', texture: '.{png,jpg,jpeg,gif,tga,bmp,psd}',
            material: '.mtl', mesh: '.{fbx,obj,dae}', audio: '.{mp3,ogg,wav,m4a}', animation: '.{anim,clip}'
        };
        try {
            const pattern = `${folder}/**/*${type !== 'all' ? extensions[type] || '' : ''}`;
            const assets = (await this.adapter.asset.queryAssets(pattern) || []).map((asset) => this.normalizeAsset(asset));
            return { success: true, data: { type, folder, count: assets.length, assets } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async getBuildSettings(): Promise<ToolResponse> {
        try {
            return { success: true, data: { ready: await this.adapter.build.queryWorkerReady() } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async createAsset(url: string, content: any = null, overwrite = false): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            const result = await this.adapter.asset.createAsset(url, content, { overwrite, rename: !overwrite });
            return { success: true, data: result || { url } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async copyOrMove(operation: 'copy' | 'move', source: string, target: string, overwrite = false): Promise<ToolResponse> {
        if (!source || !target) return { success: false, error: 'Missing source or target' };
        try {
            const options = { overwrite, rename: !overwrite };
            const result = operation === 'copy'
                ? await this.adapter.asset.copyAsset(source, target, options)
                : await this.adapter.asset.moveAsset(source, target, options);
            return { success: true, data: result || { source, target } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async deleteAsset(url: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            await this.adapter.asset.deleteAsset(url);
            return { success: true, data: { url } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async saveAsset(url: string, content: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            const result = await this.adapter.asset.saveAsset(url, content);
            return { success: true, data: result || { url } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async reimportAsset(url: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'Missing url' };
        try {
            await this.adapter.asset.reimportAsset(url);
            return { success: true, data: { url } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async queryAsset(kind: 'path' | 'uuid' | 'url', value: string): Promise<ToolResponse> {
        if (!value) return { success: false, error: `Missing ${kind === 'url' ? 'uuid' : 'url'}` };
        try {
            const result = kind === 'path'
                ? await this.adapter.asset.queryPath(value)
                : kind === 'uuid'
                    ? await this.adapter.asset.queryUuid(value)
                    : await this.adapter.asset.queryUrl(value);
            return {
                success: true,
                data: kind === 'url' ? { uuid: value, url: result } : { url: value, [kind]: result }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async findAssetByName(args: any): Promise<ToolResponse> {
        if (!args.name) return { success: false, error: 'Missing name' };
        try {
            const pattern = `${args.folder || 'db://assets'}/**/${args.name}.*`;
            return { success: true, data: await this.adapter.asset.queryAssets(pattern) || [] };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async getAssetDetails(assetPath: string, includeSubAssets = false): Promise<ToolResponse> {
        if (!assetPath) return { success: false, error: 'Missing assetPath' };
        try {
            const asset = await this.adapter.asset.queryAssetInfo(assetPath);
            if (!asset) return { success: false, error: 'Asset not found' };
            return {
                success: true,
                data: {
                    assetInfo: this.normalizeAsset(asset),
                    ...(includeSubAssets && asset.subAssets ? { subAssets: asset.subAssets } : {})
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }
}
