export interface CreateSceneRequest {
    sceneName: string;
    fullPath: string;
}

/** Version-specific bridge for scene and scene-asset Editor APIs. */
export interface SceneAdapter {
    queryNodeTree(): Promise<any>;
    executeSceneScript(method: string, args: any[]): Promise<any>;
    querySceneAssets(): Promise<any[]>;
    queryAssetUuid(scenePath: string): Promise<string | null>;
    openScene(uuid: string): Promise<void>;
    saveScene(): Promise<void>;
    createScene(request: CreateSceneRequest): Promise<any>;
    openSaveAsDialog(): Promise<void>;
    closeScene(): Promise<void>;
}
