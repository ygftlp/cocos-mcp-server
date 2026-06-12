import { ToolDefinition, ToolResponse, ToolExecutor, PrefabInfo } from '../types';
// Slim MCP prefab tool adapter: minimal prefab operations.
export class PrefabTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_prefab_list':
                return await this.getPrefabList(args?.folder);
            case 'load_prefab':
                return await this.loadPrefab(args?.prefabPath);
            case 'instantiate_prefab':
                return await this.instantiatePrefab(args);
            case 'create_prefab':
                return await this.createPrefab(args);
            case 'update_prefab':
                return await this.updatePrefab(args?.prefabPath, args?.nodeUuid);
            case 'revert_prefab':
                return await this.revertPrefab(args?.nodeUuid);
            case 'get_prefab_info':
                return await this.getPrefabInfo(args?.prefabPath);
            case 'validate_prefab':
                return await this.validatePrefab(args?.prefabPath);
            case 'duplicate_prefab':
                return await this.duplicatePrefab(args);
            case 'restore_prefab_node':
                return await this.restorePrefabNode(args?.nodeUuid, args?.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getPrefabList(folder: string = 'db://assets'): Promise<ToolResponse> {
        const pattern = folder.endsWith('/') ? `${folder}**/*.prefab` : `${folder}/**/*.prefab`;
        try {
            const results = await Editor.Message.request('asset-db', 'query-assets', { pattern });
            const prefabs: PrefabInfo[] = results.map((asset: any) => ({
                name: asset.name,
                path: asset.url,
                uuid: asset.uuid,
                folder: asset.url.substring(0, asset.url.lastIndexOf('/'))
            }));
            return { success: true, data: prefabs };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async loadPrefab(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) {
            return { success: false, error: 'Missing prefabPath' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
            if (!assetInfo?.uuid) {
                return { success: false, error: 'Prefab not found' };
            }
            const prefabData = await Editor.Message.request('scene', 'load-asset', { uuid: assetInfo.uuid });
            return {
                success: true,
                data: {
                    uuid: prefabData?.uuid || assetInfo.uuid,
                    name: prefabData?.name || assetInfo.name
                }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async instantiatePrefab(args: any): Promise<ToolResponse> {
        const prefabPath = args?.prefabPath;
        if (!prefabPath) {
            return { success: false, error: 'Missing prefabPath' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
            if (!assetInfo?.uuid) {
                return { success: false, error: 'Prefab not found' };
            }

            const createNodeOptions: any = { assetUuid: assetInfo.uuid };
            if (args?.parentUuid) createNodeOptions.parent = args.parentUuid;
            if (args?.name) createNodeOptions.name = args.name;
            if (args?.position) {
                createNodeOptions.dump = { position: { value: args.position } };
            }

            const nodeUuid = await Editor.Message.request('scene', 'create-node', createNodeOptions);
            const uuid = Array.isArray(nodeUuid) ? nodeUuid[0] : nodeUuid;

            return {
                success: true,
                data: {
                    nodeUuid: uuid,
                    prefabPath,
                    prefabUuid: assetInfo.uuid
                }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    // Create prefab via scene script and verify asset-db creation.

    private async createPrefab(args: any): Promise<ToolResponse> {
        const nodeUuid = args?.nodeUuid;
        const pathParam = args?.prefabPath || args?.savePath;
        if (!nodeUuid || !pathParam) {
            return { success: false, error: 'Missing nodeUuid or prefabPath/savePath' };
        }
        const prefabName = args?.prefabName || 'NewPrefab';
        const fullPath = pathParam.endsWith('.prefab') ? pathParam : `${pathParam}/${prefabName}.prefab`;
        try {
            const result = await Editor.Message.request('scene', 'execute-scene-script', {
                name: 'cocos-mcp-server',
                method: 'createPrefabFromNode',
                args: [nodeUuid, fullPath]
            });
            if (!result?.success) {
                return { success: false, error: result?.error || 'createPrefabFromNode failed' };
            }
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', fullPath);
            if (!assetInfo?.uuid) {
                return { success: false, error: 'Prefab was not created. Please create it via the editor.' };
            }
            return { success: true, data: { prefabPath: fullPath, prefabUuid: assetInfo.uuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async updatePrefab(prefabPath: string, nodeUuid: string): Promise<ToolResponse> {
        if (!prefabPath || !nodeUuid) {
            return { success: false, error: 'Missing prefabPath or nodeUuid' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
            if (!assetInfo?.uuid) {
                return { success: false, error: 'Prefab not found' };
            }
            await Editor.Message.request('scene', 'apply-prefab', { node: nodeUuid, prefab: assetInfo.uuid });
            return { success: true, data: { prefabUuid: assetInfo.uuid, nodeUuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async revertPrefab(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) {
            return { success: false, error: 'Missing nodeUuid' };
        }
        try {
            await Editor.Message.request('scene', 'revert-prefab', { uuid: nodeUuid });
            return { success: true, data: { nodeUuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async getPrefabInfo(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) {
            return { success: false, error: 'Missing prefabPath' };
        }
        try {
            const assetInfo = await Editor.Message.request('asset-db', 'query-asset-info', prefabPath);
            if (!assetInfo) {
                return { success: false, error: 'Prefab not found' };
            }
            return {
                success: true,
                data: {
                    name: assetInfo.name,
                    uuid: assetInfo.uuid,
                    path: prefabPath,
                    folder: prefabPath.substring(0, prefabPath.lastIndexOf('/'))
                }
            };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async validatePrefab(prefabPath: string): Promise<ToolResponse> {
        if (!prefabPath) {
            return { success: false, error: 'Missing prefabPath' };
        }
        try {
            const content = await Editor.Message.request('asset-db', 'read-asset', prefabPath);
            const prefabData = JSON.parse(content);
            const valid = Array.isArray(prefabData) && prefabData.length > 0;
            return { success: true, data: { valid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async duplicatePrefab(args: any): Promise<ToolResponse> {
        const source = args?.sourcePath || args?.prefabPath;
        const target = args?.targetPath || args?.savePath;
        if (!source || !target) {
            return { success: false, error: 'Missing sourcePath/prefabPath or targetPath/savePath' };
        }
        try {
            const result = await Editor.Message.request('asset-db', 'copy-asset', source, target, {
                overwrite: !!args?.overwrite,
                rename: !args?.overwrite
            });
            return { success: true, data: result || { source, target } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async restorePrefabNode(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        if (!nodeUuid || !assetUuid) {
            return { success: false, error: 'Missing nodeUuid or assetUuid' };
        }
        try {
            await (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid);
            return { success: true, data: { nodeUuid, assetUuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }
}
