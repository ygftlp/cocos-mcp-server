import { SceneAdapter } from '../adapters/contracts/scene-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolResponse, ToolExecutor, SceneInfo } from '../types';

export class SceneTools implements ToolExecutor {
    constructor(private readonly adapter: SceneAdapter = selectCocosAdapter().scene) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'get_current_scene': return this.getCurrentScene();
            case 'get_scene_list': return this.getSceneList();
            case 'open_scene': return this.openScene(args.scenePath);
            case 'save_scene': return this.saveScene();
            case 'create_scene': return this.createScene(args.sceneName, args.savePath);
            case 'save_scene_as': return this.saveSceneAs(args.path);
            case 'close_scene': return this.closeScene();
            case 'get_scene_hierarchy': return this.getSceneHierarchy(args.includeComponents);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async getCurrentScene(): Promise<ToolResponse> {
        try {
            const tree = await this.adapter.queryNodeTree();
            if (tree?.uuid) {
                return {
                    success: true,
                    data: {
                        name: tree.name || 'Current Scene',
                        uuid: tree.uuid,
                        type: tree.type || 'cc.Scene',
                        active: tree.active !== undefined ? tree.active : true,
                        nodeCount: tree.children ? tree.children.length : 0
                    }
                };
            }
            return { success: false, error: 'No scene data available' };
        } catch (directError: any) {
            try {
                return await this.adapter.executeSceneScript('getCurrentSceneInfo', []);
            } catch (scriptError: any) {
                return { success: false, error: `Direct API failed: ${directError.message}, Scene script failed: ${scriptError.message}` };
            }
        }
    }

    private async getSceneList(): Promise<ToolResponse> {
        try {
            const results = await this.adapter.querySceneAssets();
            const scenes: SceneInfo[] = (results || []).map((asset: any) => ({
                name: asset.name,
                path: asset.url,
                uuid: asset.uuid
            }));
            return { success: true, data: scenes };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async openScene(scenePath: string): Promise<ToolResponse> {
        if (!scenePath) return { success: false, error: 'scenePath is required' };
        try {
            const uuid = await this.adapter.queryAssetUuid(scenePath);
            if (!uuid) return { success: false, error: 'Scene not found' };
            await this.adapter.openScene(uuid);
            return { success: true, message: `Scene opened: ${scenePath}` };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async saveScene(): Promise<ToolResponse> {
        try {
            await this.adapter.saveScene();
            return { success: true, message: 'Scene saved successfully' };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async createScene(sceneName: string, savePath: string): Promise<ToolResponse> {
        if (!sceneName || !savePath) return { success: false, error: 'sceneName and savePath are required' };
        const fullPath = savePath.endsWith('.scene') ? savePath : `${savePath}/${sceneName}.scene`;
        try {
            const result = await this.adapter.createScene({ sceneName, fullPath });
            const sceneList = await this.getSceneList();
            const createdScene = sceneList.data?.find((scene: any) => scene.uuid === result?.uuid);
            return {
                success: true,
                data: {
                    uuid: result?.uuid,
                    url: result?.url || fullPath,
                    name: sceneName,
                    message: `Scene '${sceneName}' created successfully`,
                    sceneVerified: Boolean(createdScene)
                },
                verificationData: createdScene
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async getSceneHierarchy(includeComponents = false): Promise<ToolResponse> {
        try {
            const tree = await this.adapter.queryNodeTree();
            if (!tree) return { success: false, error: 'No scene hierarchy available' };
            return { success: true, data: this.buildHierarchy(tree, includeComponents) };
        } catch (directError: any) {
            try {
                return await this.adapter.executeSceneScript('getSceneHierarchy', [includeComponents]);
            } catch (scriptError: any) {
                return { success: false, error: `Direct API failed: ${directError.message}, Scene script failed: ${scriptError.message}` };
            }
        }
    }

    private buildHierarchy(node: any, includeComponents: boolean): any {
        const result: any = {
            uuid: node.uuid,
            name: node.name,
            type: node.type,
            active: node.active,
            children: []
        };
        if (includeComponents && node.__comps__) {
            result.components = node.__comps__.map((component: any) => ({
                type: component.__type__ || 'Unknown',
                enabled: component.enabled !== undefined ? component.enabled : true
            }));
        }
        result.children = (node.children || []).map((child: any) => this.buildHierarchy(child, includeComponents));
        return result;
    }

    private async saveSceneAs(path: string): Promise<ToolResponse> {
        try {
            await this.adapter.openSaveAsDialog();
            return { success: true, data: { path, message: 'Scene save-as dialog opened' } };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }

    private async closeScene(): Promise<ToolResponse> {
        try {
            await this.adapter.closeScene();
            return { success: true, message: 'Scene closed successfully' };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }
}
