import {
    MoveArrayElementRequest,
    PasteNodeRequest,
    RemoveArrayElementRequest,
    SceneAdvancedAdapter
} from '../contracts/scene-advanced-adapter';

export class Creator38xSceneAdvancedAdapter implements SceneAdvancedAdapter {
    async resetProperty(uuid: string, path: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'reset-property', {
            uuid,
            path,
            dump: { value: null }
        });
    }

    async moveArrayElement(request: MoveArrayElementRequest): Promise<void> {
        await (Editor.Message.request as any)('scene', 'move-array-element', request);
    }

    async removeArrayElement(request: RemoveArrayElementRequest): Promise<void> {
        await (Editor.Message.request as any)('scene', 'remove-array-element', request);
    }

    copyNode(uuids: string | string[]): Promise<any> {
        return (Editor.Message.request as any)('scene', 'copy-node', uuids);
    }

    pasteNode(request: PasteNodeRequest): Promise<any> {
        return (Editor.Message.request as any)('scene', 'paste-node', request);
    }

    cutNode(uuids: string | string[]): Promise<any> {
        return (Editor.Message.request as any)('scene', 'cut-node', uuids);
    }

    async resetNode(uuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'reset-node', { uuid });
    }

    async resetComponent(uuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'reset-component', { uuid });
    }

    async restorePrefab(nodeUuid: string, assetUuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'restore-prefab', nodeUuid, assetUuid);
    }

    executeComponentMethod(uuid: string, name: string, args: any[]): Promise<any> {
        return (Editor.Message.request as any)('scene', 'execute-component-method', { uuid, name, args });
    }

    executeSceneScript(name: string, method: string, args: any[]): Promise<any> {
        return (Editor.Message.request as any)('scene', 'execute-scene-script', { name, method, args });
    }

    async snapshot(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'snapshot');
    }

    async abortSnapshot(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'snapshot-abort');
    }

    beginRecording(nodeUuid: string): Promise<string> {
        return (Editor.Message.request as any)('scene', 'begin-recording', nodeUuid);
    }

    async endRecording(undoId: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'end-recording', undoId);
    }

    async cancelRecording(undoId: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'cancel-recording', undoId);
    }

    async softReload(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'soft-reload');
    }

    async queryReady(): Promise<boolean> {
        return Boolean(await (Editor.Message.request as any)('scene', 'query-is-ready'));
    }

    async queryDirty(): Promise<boolean> {
        return Boolean(await (Editor.Message.request as any)('scene', 'query-dirty'));
    }

    queryClasses(extendsClass?: string): Promise<any[]> {
        return (Editor.Message.request as any)('scene', 'query-classes', extendsClass ? { extends: extendsClass } : {});
    }

    queryComponents(): Promise<any[]> {
        return (Editor.Message.request as any)('scene', 'query-components');
    }

    async queryComponentHasScript(className: string): Promise<boolean> {
        return Boolean(await (Editor.Message.request as any)('scene', 'query-component-has-script', className));
    }

    queryNodesByAssetUuid(assetUuid: string): Promise<string[]> {
        return (Editor.Message.request as any)('scene', 'query-nodes-by-asset-uuid', assetUuid);
    }
}
