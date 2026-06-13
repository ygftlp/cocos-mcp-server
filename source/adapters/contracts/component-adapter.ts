export interface SetComponentPropertyRequest {
    uuid: string;
    path: string;
    dump: any;
}

/** Version-specific bridge for component CRUD and serialized property APIs. */
export interface ComponentAdapter {
    createComponent(nodeUuid: string, componentType: string): Promise<void>;
    removeComponent(nodeUuid: string, componentType: string): Promise<void>;
    queryNode(nodeUuid: string): Promise<any>;
    setSerializedProperty(request: SetComponentPropertyRequest): Promise<void>;
}
