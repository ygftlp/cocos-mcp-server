import * as fs from 'fs';
import * as path from 'path';
import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class AssetAdvancedTools implements ToolExecutor {
    constructor(private readonly adapter: CocosAdapter = selectCocosAdapter()) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'save_asset_meta': return this.saveAssetMeta(args?.urlOrUUID, args?.content);
            case 'generate_available_url': return this.generateAvailableUrl(args?.url);
            case 'query_asset_db_ready': return this.queryAssetDbReady();
            case 'open_asset_external': return this.openAssetExternal(args?.urlOrUUID);
            case 'batch_import_assets': return this.batchImportAssets(args || {});
            case 'batch_delete_assets': return this.batchDeleteAssets(args?.urls);
            case 'validate_asset_references': return this.validateAssetReferences(args?.directory);
            case 'get_asset_dependencies': return this.unsupported('Asset dependency analysis is not available through the current public adapter contract.');
            case 'get_unused_assets': return this.unsupported('Unused asset detection requires whole-project reference analysis and is not implemented.');
            case 'compress_textures': return this.unsupported('Texture compression is not implemented by the MCP server.');
            case 'export_asset_manifest': return this.exportAssetManifest(args?.directory, args?.format, args?.includeMetadata);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private failure(error: any): ToolResponse {
        return { success: false, error: error?.message || String(error) };
    }

    private unsupported(error: string): ToolResponse {
        return { success: false, error };
    }

    private async saveAssetMeta(urlOrUuid: string, content: string): Promise<ToolResponse> {
        if (!urlOrUuid || typeof content !== 'string') {
            return { success: false, error: 'urlOrUUID and content are required' };
        }
        try {
            const result = await this.adapter.asset.saveAssetMeta(urlOrUuid, content);
            return {
                success: true,
                data: {
                    uuid: result?.uuid,
                    url: result?.url,
                    message: 'Asset meta saved successfully'
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async generateAvailableUrl(url: string): Promise<ToolResponse> {
        if (!url) return { success: false, error: 'url is required' };
        try {
            const availableUrl = await this.adapter.asset.generateAvailableUrl(url);
            return {
                success: true,
                data: {
                    originalUrl: url,
                    availableUrl,
                    message: availableUrl === url ? 'URL is available' : 'Generated new available URL'
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async queryAssetDbReady(): Promise<ToolResponse> {
        try {
            const ready = await this.adapter.asset.queryReady();
            return {
                success: true,
                data: { ready, message: ready ? 'Asset database is ready' : 'Asset database is not ready' }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async openAssetExternal(urlOrUuid: string): Promise<ToolResponse> {
        if (!urlOrUuid) return { success: false, error: 'urlOrUUID is required' };
        try {
            await this.adapter.asset.openAsset(urlOrUuid);
            return { success: true, message: 'Asset opened with external program' };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async batchImportAssets(args: any): Promise<ToolResponse> {
        if (!args.sourceDirectory || !args.targetDirectory) {
            return { success: false, error: 'sourceDirectory and targetDirectory are required' };
        }
        if (!fs.existsSync(args.sourceDirectory)) {
            return { success: false, error: 'Source directory does not exist' };
        }
        try {
            const files = this.getFilesFromDirectory(
                args.sourceDirectory,
                Array.isArray(args.fileFilter) ? args.fileFilter : [],
                Boolean(args.recursive)
            );
            const results: any[] = [];
            for (const filePath of files) {
                const target = `${String(args.targetDirectory).replace(/\/$/, '')}/${path.basename(filePath)}`;
                try {
                    const imported = await this.adapter.asset.importAsset(filePath, target, {
                        overwrite: Boolean(args.overwrite),
                        rename: !args.overwrite
                    });
                    results.push({ source: filePath, target, success: true, uuid: imported?.uuid });
                } catch (error: any) {
                    results.push({ source: filePath, target, success: false, error: error?.message || String(error) });
                }
            }
            const successCount = results.filter((item) => item.success).length;
            return {
                success: true,
                data: {
                    totalFiles: results.length,
                    successCount,
                    errorCount: results.length - successCount,
                    results,
                    message: `Batch import completed: ${successCount} success, ${results.length - successCount} errors`
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private getFilesFromDirectory(directory: string, fileFilter: string[], recursive: boolean): string[] {
        const files: string[] = [];
        for (const item of fs.readdirSync(directory)) {
            const fullPath = path.join(directory, item);
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                if (!fileFilter.length || fileFilter.some((extension) => item.toLowerCase().endsWith(String(extension).toLowerCase()))) {
                    files.push(fullPath);
                }
            } else if (stat.isDirectory() && recursive) {
                files.push(...this.getFilesFromDirectory(fullPath, fileFilter, true));
            }
        }
        return files;
    }

    private async batchDeleteAssets(urls: string[]): Promise<ToolResponse> {
        if (!Array.isArray(urls) || !urls.length) {
            return { success: false, error: 'urls must be a non-empty array' };
        }
        const results: any[] = [];
        for (const url of urls) {
            try {
                await this.adapter.asset.deleteAsset(url);
                results.push({ url, success: true });
            } catch (error: any) {
                results.push({ url, success: false, error: error?.message || String(error) });
            }
        }
        const successCount = results.filter((item) => item.success).length;
        return {
            success: true,
            data: {
                totalAssets: results.length,
                successCount,
                errorCount: results.length - successCount,
                results,
                message: `Batch delete completed: ${successCount} success, ${results.length - successCount} errors`
            }
        };
    }

    private async validateAssetReferences(directory = 'db://assets'): Promise<ToolResponse> {
        try {
            const assets = await this.adapter.asset.queryAssets(`${directory}/**/*`);
            const brokenAssets: any[] = [];
            let validReferences = 0;
            for (const asset of assets || []) {
                try {
                    const info = await this.adapter.asset.queryAssetInfo(asset.url);
                    if (info) validReferences++;
                    else brokenAssets.push({ url: asset.url, uuid: asset.uuid, name: asset.name, error: 'Asset info not found' });
                } catch (error: any) {
                    brokenAssets.push({
                        url: asset.url,
                        uuid: asset.uuid,
                        name: asset.name,
                        error: error?.message || String(error)
                    });
                }
            }
            return {
                success: true,
                data: {
                    directory,
                    totalAssets: assets.length,
                    validReferences,
                    brokenReferences: brokenAssets.length,
                    brokenAssets,
                    message: `Validation completed: ${brokenAssets.length} broken references found`
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async exportAssetManifest(directory = 'db://assets', format = 'json', includeMetadata = true): Promise<ToolResponse> {
        try {
            const assets = await this.adapter.asset.queryAssets(`${directory}/**/*`);
            const manifest: any[] = [];
            for (const asset of assets || []) {
                const entry: any = {
                    name: asset.name,
                    url: asset.url,
                    uuid: asset.uuid,
                    type: asset.type,
                    size: typeof asset.size === 'number' ? asset.size : 0,
                    isDirectory: Boolean(asset.isDirectory)
                };
                if (includeMetadata) {
                    try {
                        const info = await this.adapter.asset.queryAssetInfo(asset.url);
                        if (info?.meta) entry.meta = info.meta;
                    } catch {
                        // Metadata is optional; keep the manifest entry.
                    }
                }
                manifest.push(entry);
            }
            const output = format === 'csv'
                ? this.convertToCSV(manifest)
                : format === 'xml'
                    ? this.convertToXML(manifest)
                    : JSON.stringify(manifest, null, 2);
            return {
                success: true,
                data: {
                    directory,
                    format,
                    assetCount: manifest.length,
                    includeMetadata,
                    manifest: output,
                    message: `Asset manifest exported with ${manifest.length} assets`
                }
            };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private convertToCSV(data: any[]): string {
        if (!data.length) return '';
        const headers = Object.keys(data[0]);
        return [
            headers.join(','),
            ...data.map((row) => headers.map((header) => {
                const value = row[header];
                const raw = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
                return `"${raw.replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');
    }

    private convertToXML(data: any[]): string {
        const escape = (value: any) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const items = data.map((item) => {
            const fields = Object.entries(item)
                .map(([key, value]) => `    <${key}>${escape(typeof value === 'object' ? JSON.stringify(value) : value)}</${key}>`)
                .join('\n');
            return `  <asset>\n${fields}\n  </asset>`;
        }).join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<assets>\n${items}\n</assets>`;
    }
}
