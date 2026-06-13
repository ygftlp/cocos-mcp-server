import { CreateNodeRequest, NodeAdapter, SetNodeParentRequest, SetNodePropertyRequest } from './contracts/node-adapter';
import { CreateSceneRequest, SceneAdapter } from './contracts/scene-adapter';

function unavailable(domain: string): never {
    throw new Error(`${domain} adapter is unavailable for the active Cocos Creator version`);
}

export class UnavailableNodeAdapter implements NodeAdapter {
    queryAssetInfo(_assetPath: string): Promise<any> { return Promise.reject(unavailable('Node')); }
    createNode(_request: CreateNodeRequest): Promise<any> { return Promise.reject(unavailable('Node')); }
    queryNode(_uuid: string): Promise<any> { return Promise.reject(unavailable('Node')); }
    queryNodeTree(): Promise<any> { return Promise.reject(unavailable('Node')); }
    setNodeProperty(_request: SetNodePropertyRequest): Promise<void> { return Promise.reject(unavailable('Node')); }
    removeNode(_uuid: string): Promise<void> { return Promise.reject(unavailable('Node')); }
    setNodeParent(_request: SetNodeParentRequest): Promise<void> { return Promise.reject(unavailable('Node')); }
    duplicateNode(_uuid: string): Promise<any> { return Promise.reject(unavailable('Node')); }
}

export class UnavailableSceneAdapter implements SceneAdapter {
    queryNodeTree(): Promise<any> { return Promise.reject(unavailable('Scene')); }
    executeSceneScript(_method: string, _args: any[]): Promise<any> { return Promise.reject(unavailable('Scene')); }
    querySceneAssets(): Promise<any[]> { return Promise.reject(unavailable('Scene')); }
    queryAssetUuid(_scenePath: string): Promise<string | null> { return Promise.reject(unavailable('Scene')); }
    openScene(_uuid: string): Promise<void> { return Promise.reject(unavailable('Scene')); }
    saveScene(): Promise<void> { return Promise.reject(unavailable('Scene')); }
    createScene(_request: CreateSceneRequest): Promise<any> { return Promise.reject(unavailable('Scene')); }
    openSaveAsDialog(): Promise<void> { return Promise.reject(unavailable('Scene')); }
    closeScene(): Promise<void> { return Promise.reject(unavailable('Scene')); }
}
