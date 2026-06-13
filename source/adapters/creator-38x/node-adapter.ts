import { CreateNodeRequest, NodeAdapter, SetNodeParentRequest, SetNodePropertyRequest } from '../contracts/node-adapter';

export class Creator38xNodeAdapter implements NodeAdapter {
    queryAssetInfo(assetPath: string): Promise<any> {
        return (Editor.Message.request as any)('asset-db', 'query-asset-info', assetPath);
    }

    createNode(request: CreateNodeRequest): Promise<any> {
        return (Editor.Message.request as any)('scene', 'create-node', request);
    }

    queryNode(uuid: string): Promise<any> {
        return (Editor.Message.request as any)('scene', 'query-node', uuid);
    }

    queryNodeTree(): Promise<any> {
        return (Editor.Message.request as any)('scene', 'query-node-tree');
    }

    async setNodeProperty(request: SetNodePropertyRequest): Promise<void> {
        await (Editor.Message.request as any)('scene', 'set-property', {
            uuid: request.uuid,
            path: request.path,
            dump: { value: request.value }
        });
    }

    async removeNode(uuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'remove-node', { uuid });
    }

    async setNodeParent(request: SetNodeParentRequest): Promise<void> {
        await (Editor.Message.request as any)('scene', 'set-parent', request);
    }

    duplicateNode(uuid: string): Promise<any> {
        return (Editor.Message.request as any)('scene', 'duplicate-node', uuid);
    }
}
