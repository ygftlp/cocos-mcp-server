export interface CreateNodeRequest {
    name: string;
    parent?: string;
    assetUuid?: string;
    unlinkPrefab?: boolean;
    components?: string[];
    keepWorldTransform?: boolean;
}

export interface SetNodePropertyRequest {
    uuid: string;
    path: string;
    value: any;
}

export interface SetNodeParentRequest {
    parent: string;
    uuids: string[];
    keepWorldTransform: boolean;
    index?: number;
}

/** Version-specific bridge for hierarchy and node Editor APIs. */
export interface NodeAdapter {
    queryAssetInfo(assetPath: string): Promise<any>;
    createNode(request: CreateNodeRequest): Promise<any>;
    queryNode(uuid: string): Promise<any>;
    queryNodeTree(): Promise<any>;
    setNodeProperty(request: SetNodePropertyRequest): Promise<void>;
    removeNode(uuid: string): Promise<void>;
    setNodeParent(request: SetNodeParentRequest): Promise<void>;
    duplicateNode(uuid: string): Promise<any>;
}
