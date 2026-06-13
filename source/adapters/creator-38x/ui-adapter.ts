import { UIAdapter, UIEventHandlerInput, UIEventMode } from '../contracts/ui-adapter';

export class Creator38xUIAdapter implements UIAdapter {
    async configureEvent(
        nodeUuid: string,
        componentType: string,
        eventProperty: string,
        handlers: UIEventHandlerInput[],
        mode: UIEventMode
    ): Promise<any> {
        const result = await (Editor.Message.request as any)('scene', 'execute-scene-script', {
            name: 'cocos-mcp-server',
            method: 'configureUIEvent',
            args: [nodeUuid, componentType, eventProperty, handlers, mode]
        });
        if (result?.success) (Editor.Message.send as any)('scene', 'snapshot');
        return result;
    }

    listEvents(nodeUuid: string, componentType: string, eventProperty?: string | null): Promise<any> {
        return (Editor.Message.request as any)('scene', 'execute-scene-script', {
            name: 'cocos-mcp-server',
            method: 'getUIEventHandlers',
            args: [nodeUuid, componentType, eventProperty || null]
        });
    }
}
