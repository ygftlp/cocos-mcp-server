import { SceneAdvancedAdapter } from '../adapters/contracts/scene-advanced-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class SceneAdvancedTools implements ToolExecutor {
    constructor(private readonly adapter: SceneAdvancedAdapter = selectCocosAdapter().sceneAdvanced) {}

    getTools(): ToolDefinition[] { return []; }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'reset_node_property': return this.resetNodeProperty(args?.uuid, args?.path);
            case 'move_array_element': return this.moveArrayElement(args?.uuid, args?.path, args?.target, args?.offset);
            case 'remove_array_element': return this.removeArrayElement(args?.uuid, args?.path, args?.index);
            case 'copy_node': return this.copyNode(args?.uuids);
            case 'paste_node': return this.pasteNode(args?.target, args?.uuids, args?.keepWorldTransform);
            case 'cut_node': return this.cutNode(args?.uuids);
            case 'reset_node_transform': return this.resetNodeTransform(args?.uuid);
            case 'reset_component': return this.resetComponent(args?.uuid);
            case 'restore_prefab': return this.restorePrefab(args?.nodeUuid, args?.assetUuid);
            case 'execute_component_method': return this.executeComponentMethod(args?.uuid, args?.name, args?.args);
            case 'execute_scene_script': return this.executeSceneScript(args?.name, args?.method, args?.args);
            case 'scene_snapshot': return this.sceneSnapshot();
            case 'scene_snapshot_abort': return this.sceneSnapshotAbort();
            case 'begin_undo_recording': return this.beginUndoRecording(args?.nodeUuid);
            case 'end_undo_recording': return this.endUndoRecording(args?.undoId);
            case 'cancel_undo_recording': return this.cancelUndoRecording(args?.undoId);
            case 'soft_reload_scene': return this.softReloadScene();
            case 'query_scene_ready': return this.querySceneReady();
            case 'query_scene_dirty': return this.querySceneDirty();
            case 'query_scene_classes': return this.querySceneClasses(args?.extends);
            case 'query_scene_components': return this.querySceneComponents();
            case 'query_component_has_script': return this.queryComponentHasScript(args?.className);
            case 'query_nodes_by_asset_uuid': return this.queryNodesByAssetUuid(args?.assetUuid);
            default: throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private failure(error: any): ToolResponse {
        return { success: false, error: error?.message || String(error) };
    }

    private async resetNodeProperty(uuid: string, path: string): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        try {
            await this.adapter.resetProperty(uuid, path);
            return { success: true, data: { uuid, path } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async moveArrayElement(uuid: string, path: string, target: number, offset: number): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        if (!Number.isInteger(target) || !Number.isInteger(offset)) {
            return { success: false, error: 'target and offset must be integers' };
        }
        try {
            await this.adapter.moveArrayElement({ uuid, path, target, offset });
            return { success: true, data: { uuid, path, target, offset } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async removeArrayElement(uuid: string, path: string, index: number): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        if (!Number.isInteger(index) || index < 0) return { success: false, error: 'index must be a non-negative integer' };
        try {
            await this.adapter.removeArrayElement({ uuid, path, index });
            return { success: true, data: { uuid, path, index } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async copyNode(uuids: string | string[]): Promise<ToolResponse> {
        if (!uuids || (Array.isArray(uuids) && uuids.length === 0)) return { success: false, error: 'Missing uuids' };
        try {
            const result = await this.adapter.copyNode(uuids);
            return { success: true, data: { copiedUuids: result } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async pasteNode(target: string, uuids: string | string[] | undefined, keepWorldTransform = false): Promise<ToolResponse> {
        if (!target) return { success: false, error: 'Missing target' };
        try {
            const result = await this.adapter.pasteNode({ target, uuids, keepWorldTransform: Boolean(keepWorldTransform) });
            return { success: true, data: { newUuids: result } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async cutNode(uuids: string | string[]): Promise<ToolResponse> {
        if (!uuids || (Array.isArray(uuids) && uuids.length === 0)) return { success: false, error: 'Missing uuids' };
        try {
            const result = await this.adapter.cutNode(uuids);
            return { success: true, data: { cutUuids: result } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async resetNodeTransform(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            await this.adapter.resetNode(uuid);
            return { success: true, data: { uuid } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async resetComponent(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            await this.adapter.resetComponent(uuid);
            return { success: true, data: { uuid } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async restorePrefab(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        if (!nodeUuid || !assetUuid) return { success: false, error: 'Missing nodeUuid or assetUuid' };
        try {
            await this.adapter.restorePrefab(nodeUuid, assetUuid);
            return { success: true, data: { nodeUuid, assetUuid } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async executeComponentMethod(uuid: string, name: string, args: any[] = []): Promise<ToolResponse> {
        if (!uuid || !name) return { success: false, error: 'Missing uuid or name' };
        try {
            const result = await this.adapter.executeComponentMethod(uuid, name, Array.isArray(args) ? args : []);
            return { success: true, data: { result } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async executeSceneScript(name: string, method: string, args: any[] = []): Promise<ToolResponse> {
        if (!name || !method) return { success: false, error: 'Missing name or method' };
        try {
            const result = await this.adapter.executeSceneScript(name, method, Array.isArray(args) ? args : []);
            return { success: true, data: result };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async sceneSnapshot(): Promise<ToolResponse> {
        try {
            await this.adapter.snapshot();
            return { success: true };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async sceneSnapshotAbort(): Promise<ToolResponse> {
        try {
            await this.adapter.abortSnapshot();
            return { success: true };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async beginUndoRecording(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) return { success: false, error: 'Missing nodeUuid' };
        try {
            const undoId = await this.adapter.beginRecording(nodeUuid);
            return { success: true, data: { undoId } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async endUndoRecording(undoId: string): Promise<ToolResponse> {
        if (!undoId) return { success: false, error: 'Missing undoId' };
        try {
            await this.adapter.endRecording(undoId);
            return { success: true };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async cancelUndoRecording(undoId: string): Promise<ToolResponse> {
        if (!undoId) return { success: false, error: 'Missing undoId' };
        try {
            await this.adapter.cancelRecording(undoId);
            return { success: true };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async softReloadScene(): Promise<ToolResponse> {
        try {
            await this.adapter.softReload();
            return { success: true };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async querySceneReady(): Promise<ToolResponse> {
        try {
            return { success: true, data: { ready: await this.adapter.queryReady() } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async querySceneDirty(): Promise<ToolResponse> {
        try {
            return { success: true, data: { dirty: await this.adapter.queryDirty() } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async querySceneClasses(extendsClass?: string): Promise<ToolResponse> {
        try {
            return { success: true, data: { classes: await this.adapter.queryClasses(extendsClass) } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async querySceneComponents(): Promise<ToolResponse> {
        try {
            return { success: true, data: { components: await this.adapter.queryComponents() } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async queryComponentHasScript(className: string): Promise<ToolResponse> {
        if (!className) return { success: false, error: 'Missing className' };
        try {
            const hasScript = await this.adapter.queryComponentHasScript(className);
            return { success: true, data: { className, hasScript } };
        } catch (error: any) {
            return this.failure(error);
        }
    }

    private async queryNodesByAssetUuid(assetUuid: string): Promise<ToolResponse> {
        if (!assetUuid) return { success: false, error: 'Missing assetUuid' };
        try {
            const nodeUuids = await this.adapter.queryNodesByAssetUuid(assetUuid);
            return { success: true, data: { assetUuid, nodeUuids } };
        } catch (error: any) {
            return this.failure(error);
        }
    }
}
