import { CreateNodeRequest, NodeAdapter, SetNodeParentRequest, SetNodePropertyRequest } from './contracts/node-adapter';
import { CreateSceneRequest, SceneAdapter } from './contracts/scene-adapter';

function rejected(domain: string): Promise<never> {
    return Promise.reject(new Error(`${domain} adapter is unavailable for the active Cocos Creator version`));
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
