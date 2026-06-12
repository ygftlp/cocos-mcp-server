import { ToolDefinition, ToolResponse, ToolExecutor } from '../types';
// Slim MCP scene-advanced adapter: direct Editor API calls only.
export class SceneAdvancedTools implements ToolExecutor {
    getTools(): ToolDefinition[] {
        return [];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        switch (toolName) {
            case 'reset_node_property':
                return await this.resetNodeProperty(args?.uuid, args?.path);
            case 'move_array_element':
                return await this.moveArrayElement(args?.uuid, args?.path, args?.target, args?.offset);
            case 'remove_array_element':
                return await this.removeArrayElement(args?.uuid, args?.path, args?.index);
            case 'copy_node':
                return await this.copyNode(args?.uuids);
            case 'paste_node':
                return await this.pasteNode(args?.target, args?.uuids, args?.keepWorldTransform);
            case 'cut_node':
                return await this.cutNode(args?.uuids);
            case 'reset_node_transform':
                return await this.resetNodeTransform(args?.uuid);
            case 'reset_component':
                return await this.resetComponent(args?.uuid);
            case 'restore_prefab':
                return await this.restorePrefab(args?.nodeUuid, args?.assetUuid);
            case 'execute_component_method':
                return await this.executeComponentMethod(args?.uuid, args?.name, args?.args);
            case 'execute_scene_script':
                return await this.executeSceneScript(args?.name, args?.method, args?.args);
            case 'scene_snapshot':
                return await this.sceneSnapshot();
            case 'scene_snapshot_abort':
                return await this.sceneSnapshotAbort();
            case 'begin_undo_recording':
                return await this.beginUndoRecording(args?.nodeUuid);
            case 'end_undo_recording':
                return await this.endUndoRecording(args?.undoId);
            case 'cancel_undo_recording':
                return await this.cancelUndoRecording(args?.undoId);
            case 'soft_reload_scene':
                return await this.softReloadScene();
            case 'query_scene_ready':
                return await this.querySceneReady();
            case 'query_scene_dirty':
                return await this.querySceneDirty();
            case 'query_scene_classes':
                return await this.querySceneClasses(args?.extends);
            case 'query_scene_components':
                return await this.querySceneComponents();
            case 'query_component_has_script':
                return await this.queryComponentHasScript(args?.className);
            case 'query_nodes_by_asset_uuid':
                return await this.queryNodesByAssetUuid(args?.assetUuid);
            default:
                throw new Error(`Unknown tool: ${toolName}`);
        }
    }

    private async resetNodeProperty(uuid: string, path: string): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        try {
            await Editor.Message.request('scene', 'reset-property', { uuid, path, dump: { value: null } });
            return { success: true, data: { uuid, path } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async moveArrayElement(uuid: string, path: string, target: number, offset: number): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        try {
            await Editor.Message.request('scene', 'move-array-element', { uuid, path, target, offset });
            return { success: true, data: { uuid, path, target, offset } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async removeArrayElement(uuid: string, path: string, index: number): Promise<ToolResponse> {
        if (!uuid || !path) return { success: false, error: 'Missing uuid or path' };
        try {
            await Editor.Message.request('scene', 'remove-array-element', { uuid, path, index });
            return { success: true, data: { uuid, path, index } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async copyNode(uuids: string | string[]): Promise<ToolResponse> {
        if (!uuids) return { success: false, error: 'Missing uuids' };
        try {
            const result = await Editor.Message.request('scene', 'copy-node', uuids);
            return { success: true, data: { copiedUuids: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async pasteNode(target: string, uuids: string | string[], keepWorldTransform: boolean = false): Promise<ToolResponse> {
        if (!target) return { success: false, error: 'Missing target' };
        try {
            const result = await Editor.Message.request('scene', 'paste-node', { target, uuids, keepWorldTransform });
            return { success: true, data: { newUuids: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async cutNode(uuids: string | string[]): Promise<ToolResponse> {
        if (!uuids) return { success: false, error: 'Missing uuids' };
        try {
            const result = await Editor.Message.request('scene', 'cut-node', uuids);
            return { success: true, data: { cutUuids: result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async resetNodeTransform(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            await Editor.Message.request('scene', 'reset-node', { uuid });
            return { success: true, data: { uuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async resetComponent(uuid: string): Promise<ToolResponse> {
        if (!uuid) return { success: false, error: 'Missing uuid' };
        try {
            await Editor.Message.request('scene', 'reset-component', { uuid });
            return { success: true, data: { uuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async restorePrefab(nodeUuid: string, assetUuid: string): Promise<ToolResponse> {
        if (!nodeUuid || !assetUuid) return { success: false, error: 'Missing nodeUuid or assetUuid' };
        try {
            await (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid);
            return { success: true, data: { nodeUuid, assetUuid } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async executeComponentMethod(uuid: string, name: string, args: any[] = []): Promise<ToolResponse> {
        if (!uuid || !name) return { success: false, error: 'Missing uuid or name' };
        try {
            const result = await Editor.Message.request('scene', 'execute-component-method', { uuid, name, args });
            return { success: true, data: { result } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    // Thin wrapper around `execute-scene-script`.

    private async executeSceneScript(name: string, method: string, args: any[] = []): Promise<ToolResponse> {
        if (!name || !method) return { success: false, error: 'Missing name or method' };
        try {
            const result = await Editor.Message.request('scene', 'execute-scene-script', { name, method, args });
            return { success: true, data: result };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async sceneSnapshot(): Promise<ToolResponse> {
        try {
            await Editor.Message.request('scene', 'snapshot');
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async sceneSnapshotAbort(): Promise<ToolResponse> {
        try {
            await Editor.Message.request('scene', 'snapshot-abort');
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async beginUndoRecording(nodeUuid: string): Promise<ToolResponse> {
        if (!nodeUuid) return { success: false, error: 'Missing nodeUuid' };
        try {
            const undoId = await Editor.Message.request('scene', 'begin-recording', nodeUuid);
            return { success: true, data: { undoId } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async endUndoRecording(undoId: string): Promise<ToolResponse> {
        if (!undoId) return { success: false, error: 'Missing undoId' };
        try {
            await Editor.Message.request('scene', 'end-recording', undoId);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async cancelUndoRecording(undoId: string): Promise<ToolResponse> {
        if (!undoId) return { success: false, error: 'Missing undoId' };
        try {
            await Editor.Message.request('scene', 'cancel-recording', undoId);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async softReloadScene(): Promise<ToolResponse> {
        try {
            await Editor.Message.request('scene', 'soft-reload');
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async querySceneReady(): Promise<ToolResponse> {
        try {
            const ready = await Editor.Message.request('scene', 'query-is-ready');
            return { success: true, data: { ready } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async querySceneDirty(): Promise<ToolResponse> {
        try {
            const dirty = await Editor.Message.request('scene', 'query-dirty');
            return { success: true, data: { dirty } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async querySceneClasses(extendsClass?: string): Promise<ToolResponse> {
        try {
            const options = extendsClass ? { extends: extendsClass } : {};
            const classes = await Editor.Message.request('scene', 'query-classes', options);
            return { success: true, data: { classes } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async querySceneComponents(): Promise<ToolResponse> {
        try {
            const components = await Editor.Message.request('scene', 'query-components');
            return { success: true, data: { components } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async queryComponentHasScript(className: string): Promise<ToolResponse> {
        if (!className) return { success: false, error: 'Missing className' };
        try {
            const hasScript = await Editor.Message.request('scene', 'query-component-has-script', className);
            return { success: true, data: { className, hasScript } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }

    private async queryNodesByAssetUuid(assetUuid: string): Promise<ToolResponse> {
        if (!assetUuid) return { success: false, error: 'Missing assetUuid' };
        try {
            const nodeUuids = await Editor.Message.request('scene', 'query-nodes-by-asset-uuid', assetUuid);
            return { success: true, data: { assetUuid, nodeUuids } };
        } catch (err: any) {
            return { success: false, error: err?.message || String(err) };
        }
    }
}
