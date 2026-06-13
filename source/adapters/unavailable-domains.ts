import { AssetAdapter, AssetMutationOptions } from './contracts/asset-adapter';
import { BuildAdapter } from './contracts/build-adapter';
import { ComponentAdapter, SetComponentPropertyRequest } from './contracts/component-adapter';
import { CreateNodeRequest, NodeAdapter, SetNodeParentRequest, SetNodePropertyRequest } from './contracts/node-adapter';
import { PrefabAdapter } from './contracts/prefab-adapter';
import { ProjectAdapter, ProjectDescriptor } from './contracts/project-adapter';
import {
    MoveArrayElementRequest,
    PasteNodeRequest,
    RemoveArrayElementRequest,
    SceneAdvancedAdapter
} from './contracts/scene-advanced-adapter';
import { CreateSceneRequest, SceneAdapter } from './contracts/scene-adapter';
import { UIAdapter, UIEventHandlerInput, UIEventMode } from './contracts/ui-adapter';

function unavailable(domain: string): Error {
    return new Error(`${domain} adapter is unavailable for the active Cocos Creator version`);
}

function rejected(domain: string): Promise<never> {
    return Promise.reject(unavailable(domain));
}

export class UnavailableNodeAdapter implements NodeAdapter {
    queryAssetInfo(_assetPath: string): Promise<any> { return rejected('Node'); }
    createNode(_request: CreateNodeRequest): Promise<any> { return rejected('Node'); }
    queryNode(_uuid: string): Promise<any> { return rejected('Node'); }
    queryNodeTree(): Promise<any> { return rejected('Node'); }
    setNodeProperty(_request: SetNodePropertyRequest): Promise<void> { return rejected('Node'); }
    removeNode(_uuid: string): Promise<void> { return rejected('Node'); }
    setNodeParent(_request: SetNodeParentRequest): Promise<void> { return rejected('Node'); }
    duplicateNode(_uuid: string): Promise<any> { return rejected('Node'); }
}

export class UnavailableSceneAdapter implements SceneAdapter {
    queryNodeTree(): Promise<any> { return rejected('Scene'); }
    executeSceneScript(_method: string, _args: any[]): Promise<any> { return rejected('Scene'); }
    querySceneAssets(): Promise<any[]> { return rejected('Scene'); }
    queryAssetUuid(_scenePath: string): Promise<string | null> { return rejected('Scene'); }
    openScene(_uuid: string): Promise<void> { return rejected('Scene'); }
    saveScene(): Promise<void> { return rejected('Scene'); }
    createScene(_request: CreateSceneRequest): Promise<any> { return rejected('Scene'); }
    openSaveAsDialog(): Promise<void> { return rejected('Scene'); }
    closeScene(): Promise<void> { return rejected('Scene'); }
}

export class UnavailableSceneAdvancedAdapter implements SceneAdvancedAdapter {
    resetProperty(_uuid: string, _path: string): Promise<void> { return rejected('SceneAdvanced'); }
    moveArrayElement(_request: MoveArrayElementRequest): Promise<void> { return rejected('SceneAdvanced'); }
    removeArrayElement(_request: RemoveArrayElementRequest): Promise<void> { return rejected('SceneAdvanced'); }
    copyNode(_uuids: string | string[]): Promise<any> { return rejected('SceneAdvanced'); }
    pasteNode(_request: PasteNodeRequest): Promise<any> { return rejected('SceneAdvanced'); }
    cutNode(_uuids: string | string[]): Promise<any> { return rejected('SceneAdvanced'); }
    resetNode(_uuid: string): Promise<void> { return rejected('SceneAdvanced'); }
    resetComponent(_uuid: string): Promise<void> { return rejected('SceneAdvanced'); }
    restorePrefab(_nodeUuid: string, _assetUuid: string): Promise<void> { return rejected('SceneAdvanced'); }
    executeComponentMethod(_uuid: string, _name: string, _args: any[]): Promise<any> { return rejected('SceneAdvanced'); }
    executeSceneScript(_name: string, _method: string, _args: any[]): Promise<any> { return rejected('SceneAdvanced'); }
    snapshot(): Promise<void> { return rejected('SceneAdvanced'); }
    abortSnapshot(): Promise<void> { return rejected('SceneAdvanced'); }
    beginRecording(_nodeUuid: string): Promise<string> { return rejected('SceneAdvanced'); }
    endRecording(_undoId: string): Promise<void> { return rejected('SceneAdvanced'); }
    cancelRecording(_undoId: string): Promise<void> { return rejected('SceneAdvanced'); }
    softReload(): Promise<void> { return rejected('SceneAdvanced'); }
    queryReady(): Promise<boolean> { return rejected('SceneAdvanced'); }
    queryDirty(): Promise<boolean> { return rejected('SceneAdvanced'); }
    queryClasses(_extendsClass?: string): Promise<any[]> { return rejected('SceneAdvanced'); }
    queryComponents(): Promise<any[]> { return rejected('SceneAdvanced'); }
    queryComponentHasScript(_className: string): Promise<boolean> { return rejected('SceneAdvanced'); }
    queryNodesByAssetUuid(_assetUuid: string): Promise<string[]> { return rejected('SceneAdvanced'); }
}

export class UnavailableComponentAdapter implements ComponentAdapter {
    createComponent(_nodeUuid: string, _componentType: string): Promise<void> { return rejected('Component'); }
    removeComponent(_nodeUuid: string, _componentType: string): Promise<void> { return rejected('Component'); }
    queryNode(_nodeUuid: string): Promise<any> { return rejected('Component'); }
    setSerializedProperty(_request: SetComponentPropertyRequest): Promise<void> { return rejected('Component'); }
}

export class UnavailableUIAdapter implements UIAdapter {
    configureEvent(
        _nodeUuid: string,
        _componentType: string,
        _eventProperty: string,
        _handlers: UIEventHandlerInput[],
        _mode: UIEventMode
    ): Promise<any> { return rejected('UI'); }

    listEvents(_nodeUuid: string, _componentType: string, _eventProperty?: string | null): Promise<any> {
        return rejected('UI');
    }
}

export class UnavailableAssetAdapter implements AssetAdapter {
    refreshAsset(_url: string): Promise<void> { return rejected('Asset'); }
    importAsset(_sourcePath: string, _targetUrl: string, _options?: AssetMutationOptions): Promise<any> { return rejected('Asset'); }
    queryAssetInfo(_url: string): Promise<any | null> { return rejected('Asset'); }
    queryAssets(_pattern: string): Promise<any[]> { return rejected('Asset'); }
    createAsset(_url: string, _content: any, _options?: AssetMutationOptions): Promise<any> { return rejected('Asset'); }
    copyAsset(_source: string, _target: string, _options?: AssetMutationOptions): Promise<any> { return rejected('Asset'); }
    moveAsset(_source: string, _target: string, _options?: AssetMutationOptions): Promise<any> { return rejected('Asset'); }
    deleteAsset(_url: string): Promise<void> { return rejected('Asset'); }
    saveAsset(_url: string, _content: string): Promise<any> { return rejected('Asset'); }
    readAsset(_url: string): Promise<string> { return rejected('Asset'); }
    saveAssetMeta(_urlOrUuid: string, _content: string): Promise<any> { return rejected('Asset'); }
    generateAvailableUrl(_url: string): Promise<string> { return rejected('Asset'); }
    queryReady(): Promise<boolean> { return rejected('Asset'); }
    openAsset(_urlOrUuid: string): Promise<void> { return rejected('Asset'); }
    reimportAsset(_url: string): Promise<void> { return rejected('Asset'); }
    queryPath(_url: string): Promise<string | null> { return rejected('Asset'); }
    queryUuid(_url: string): Promise<string | null> { return rejected('Asset'); }
    queryUrl(_uuid: string): Promise<string | null> { return rejected('Asset'); }
}

export class UnavailablePrefabAdapter implements PrefabAdapter {
    loadAsset(_uuid: string): Promise<any> { return rejected('Prefab'); }
    createFromNode(_nodeUuid: string, _prefabPath: string): Promise<any> { return rejected('Prefab'); }
    apply(_nodeUuid: string, _prefabUuid: string): Promise<void> { return rejected('Prefab'); }
    revert(_nodeUuid: string): Promise<void> { return rejected('Prefab'); }
    restoreNode(_nodeUuid: string, _assetUuid: string): Promise<void> { return rejected('Prefab'); }
}

export class UnavailableBuildAdapter implements BuildAdapter {
    openPanel(): Promise<void> { return rejected('Build'); }
    queryWorkerReady(): Promise<boolean> { return rejected('Build'); }
    build(_options: Record<string, any>): Promise<any> { return rejected('Build'); }
}

export class UnavailableProjectAdapter implements ProjectAdapter {
    describe(): ProjectDescriptor { throw unavailable('Project'); }
    queryConfig(_name: string): Promise<any> { return rejected('Project'); }
}
