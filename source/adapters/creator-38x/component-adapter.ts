import { ComponentAdapter, SetComponentPropertyRequest } from '../contracts/component-adapter';

export class Creator38xComponentAdapter implements ComponentAdapter {
    async createComponent(nodeUuid: string, componentType: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'create-component', {
            uuid: nodeUuid,
            component: componentType
        });
    }

    async removeComponent(nodeUuid: string, componentType: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'remove-component', {
            uuid: nodeUuid,
            component: componentType
        });
    }

    queryNode(nodeUuid: string): Promise<any> {
        return (Editor.Message.request as any)('scene', 'query-node', nodeUuid);
    }

    async setSerializedProperty(request: SetComponentPropertyRequest): Promise<void> {
        await (Editor.Message.request as any)('scene', 'set-property', request);
    }
}
