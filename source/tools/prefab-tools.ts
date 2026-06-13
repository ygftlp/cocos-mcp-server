import { CocosAdapter } from '../adapters/contracts';
import { selectCocosAdapter } from '../adapters/selector';
import { PrefabInfo, ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class PrefabTools implements ToolExecutor {
    constructor(private readonly adapter: CocosAdapter = selectCocosAdapter()) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_prefab_list': return this.getPrefabList(args?.folder);
            case 'load_prefab': return this.loadPrefab(args?.prefabPath);
            case 'instantiate_prefab': return this.instantiatePrefab(args || {});
            case 'create_prefab': return this.createPrefab(args || {});
            case 'update_prefab': return this.updatePrefab(args?.prefabPath, args?.nodeUuid);
            case 'revert_prefab': return this.revertPrefab(args?.nodeUuid);
            case 'get_prefab_info': return this.getPrefabInfo(args?.prefabPath);
            case 'validate_prefab': return this.validatePrefab(args?.prefabPath);
            case 'duplicate_prefab': return this.duplicatePrefab(args || {});
            case 'restore_prefab_node': return this.restorePrefabNode(args?.nodeUuid, args?.assetUuid);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private uuidOf(value: any): string | null {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return this.uuidOf(value[0]);
        if (value && typeof value === 'object') {
            if (Object.prototype.hasOwnProperty.call(value, 'value')) return this.uuidOf(value.value);
            return this.uuidOf(value.uuid || value.id);
        }
        return null;
    }

    private async getPrefabList(folder = 'db://assets'): Promise<ToolResponse> {
        const pattern = folder.endsWith('/') ? `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
        try {
            const results = await this.adapter.asset.queryAssets(pattern);
            const prefabs: PrefabInfo[] = (results || []).map((asset: any) => ({
                name: asset.name,
                path: asset.url,
                uuid: asset.uuid,
                folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
            }));
            return { success: true, data: prefabs };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async loadPrefab(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) return { success: false, error: 'Missing prefabPath' };
        try {
            const assetInfo = await this.adapter.asset.queryAssetInfo(prefabPath);
            if (!assetInfo?.uuid) return { success: false, error: 'Prefab not found' };
            const prefabData = await this.adapter.prefab.loadAsset(assetInfo.uuid);
            return {
                success: true,
                data: {
                    uuid: prefabData?.uuid || assetInfo.uuid,
                    name: prefabData?.name || assetInfo.name
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async instantiatePrefab(args: any): Promise<ToolResponse> {
        const prefabPath = args.prefabPath;
        if (!prefabPath) return { success: false, error: 'Missing prefabPath' };
        try {
            const assetInfo = await this.adapter.asset.queryAssetInfo(prefabPath);
            if (!assetInfo?.uuid) return { success: false, error: 'Prefab not found' };
            const response = await this.adapter.node.createNode({
                name: args.name || assetInfo.name || 'Prefab',
                parent: args.parentUuid,
                assetUuid: assetInfo.uuid
            });
            const nodeUuid = this.uuidOf(response);
            if (!nodeUuid) return { success: false, error: 'Cocos did not return a prefab instance node UUID' };
            if (args.position) {
                await this.adapter.node.setNodeProperty({
                    uuid: nodeUuid,
                    path: 'position',
                    value: args.position
                });
            }
            return {
                success: true,
                data: { nodeUuid, prefabPath, prefabUuid: assetInfo.uuid }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async createPrefab(args: any): Promise<ToolResponse> {
        const nodeUuid = args.nodeUuid;
        const pathParam = args.prefabPath || args.savePath;
        if (!nodeUuid || !pathParam) {
            return { success: false, error: 'Missing nodeUuid or prefabPath/savePath' };
        }
        const prefabName = args.prefabName || 'NewPrefab';
        const fullPath = pathParam.endsWith('.prefab') ? pathParam : `${pathParam}/${prefabName}.prefab`;
        try {
            const result = await this.adapter.prefab.createFromNode(nodeUuid, fullPath);
            if (!result?.success) {
                return { success: false, error: result?.error || 'createPrefabFromNode failed' };
            }
            const assetInfo = await this.adapter.asset.queryAssetInfo(fullPath);
            if (!assetInfo?.uuid) {
                return { success: false, error: 'Prefab was not created or could not be verified' };
            }
            return { success: true, data: { prefabPath: fullPath, prefabUuid: assetInfo.uuid } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async updatePrefab(prefabPath: string, nodeUuid: string): Promise<ToolResponse> {
        if (!prefabPath || !nodeUuid) return { success: false, error: 'Missing prefabPath or nodeUuid' };
        try {
            const assetInfo = await this.adapter.asset.queryAssetInfo(prefabPath);
            if (!assetInfo?.uuid) return { success: false, error: 'Prefab not found' };
            await this.adapter.prefab.apply(nodeUuid, assetInfo.uuid);
            return { success: true, data: { prefabUuid: assetInfo.uuid, nodeUuid } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async revertPrefab(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) return { success: false, error: 'Missing nodeUuid' };
        try {
            await this.adapter.prefab.revert(nodeUuid);
            return { success: true, data: { nodeUuid } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getPrefabInfo(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) return { success: false, error: 'Missing prefabPath' };
        try {
            const assetInfo = await this.adapter.asset.queryAssetInfo(prefabPath);
            if (!assetInfo) return { success: false, error: 'Prefab not found' };
            return {
                success: true,
                data: {
                    name: assetInfo.name,
                    uuid: assetInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/'))
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async validatePrefab(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) return { success: false, error: 'Missing prefabPath' };
        try {
            const content = await this.adapter.asset.readAsset(prefabPath);
            const prefabData = JSON.parse(content);
            const valid = Array.isArray(prefabData) && prefabData.length > 0;
            return { success: true, data: { valid } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async duplicatePrefab(args: any): Promise<ToolResponse> {
        const source = args.sourcePath || args.prefabPath;
        const target = args.targetPath || args.savePath;
        if (!source || !target) {
            return { success: false, error: 'Missing sourcePath/prefabPath or targetPath/savePath' };
        }
        try {
            const result = await this.adapter.asset.copyAsset(source, target, {
                overwrite: Boolean(args.overwrite),
                rename: !args.overwrite
            });
            return { success: true, data: result || { source, target } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async restorePrefabNode(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        if (!nodeUuid || !assetUuid) return { success: false, error: 'Missing nodeUuid or assetUuid' };
        try {
            await this.adapter.prefab.restoreNode(nodeUuid, assetUuid);
            return { success: true, data: { nodeUuid, assetUuid } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }
}
