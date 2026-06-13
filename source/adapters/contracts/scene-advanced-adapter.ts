export interface MoveArrayElementRequest {
    uuid: string;
    path: string;
    target: number;
    offset: number;
}

export interface RemoveArrayElementRequest {
    uuid: string;
    path: string;
    index: number;
}

export interface PasteNodeRequest {
    target: string;
    uuids?: string | string[];
    keepWorldTransform: boolean;
}

/** Version-specific bridge for advanced scene editing and inspection APIs. */
export interface SceneAdvancedAdapter {
    resetProperty(uuid: string, path: string): Promise<void>;
    moveArrayElement(request: MoveArrayElementRequest): Promise<void>;
    removeArrayElement(request: RemoveArrayElementRequest): Promise<void>;
    copyNode(uuids: string | string[]): Promise<any>;
    pasteNode(request: PasteNodeRequest): Promise<any>;
    cutNode(uuids: string | string[]): Promise<any>;
    resetNode(uuid: string): Promise<void>;
    resetComponent(uuid: string): Promise<void>;
    restorePrefab(nodeUuid: string, assetUuid: string): Promise<void>;
    executeComponentMethod(uuid: string, name: string, args: any[]): Promise<any>;
    executeSceneScript(name: string, method: string, args: any[]): Promise<any>;
    snapshot(): Promise<void>;
    abortSnapshot(): Promise<void>;
    beginRecording(nodeUuid: string): Promise<string>;
    endRecording(undoId: string): Promise<void>;
    cancelRecording(undoId: string): Promise<void>;
    softReload(): Promise<void>;
    queryReady(): Promise<boolean>;
    queryDirty(): Promise<boolean>;
    queryClasses(extendsClass?: string): Promise<any[]>;
    queryComponents(): Promise<any[]>;
    queryComponentHasScript(className: string): Promise<boolean>;
    queryNodesByAssetUuid(assetUuid: string): Promise<string[]>;
}
