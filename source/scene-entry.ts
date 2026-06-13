import { join } from 'path';
import { methods as legacyMethods } from './scene';

module.paths.push(join(Editor.App.path, 'node_modules'));

type HandlerInput = {
    targetNodeUuid: string;
    component: string;
    handler: string;
    customEventData?: string;
};

function getSceneNode(uuid: string): any | null {
    const { director } = require('cc');
    const scene = director.getScene();
    return scene?.getChildByUuid(uuid) || null;
}

function getComponent(node: any, componentType: string): any | null {
    const { js } = require('cc');
    const ComponentClass = js.getClassByName(componentType);
    if (ComponentClass) return node.getComponent(ComponentClass);
    return node.components.find((component: any) => {
        const className = js.getClassName(component) || component.constructor?.name;
        return className === componentType || `cc.${className}` === componentType;
    }) || null;
}

function serializeHandler(handler: any): HandlerInput {
    return {
        targetNodeUuid: handler.target?.uuid || '',
        component: handler.component || '',
        handler: handler.handler || '',
        customEventData: handler.customEventData || ''
    };
}

const uiMethods = {
    configureUIEvent(
        nodeUuid: string,
        componentType: string,
        eventProperty: string,
        handlers: HandlerInput[],
        mode: 'add' | 'replace' | 'clear' = 'add'
    ) {
        try {
            const { EventHandler } = require('cc');
            const node = getSceneNode(nodeUuid);
            if (!node) return { success: false, error: `Node not found: ${nodeUuid}` };
            const component = getComponent(node, componentType);
            if (!component) return { success: false, error: `Component not found: ${componentType}` };
            if (!Array.isArray(component[eventProperty])) {
                return { success: false, error: `Event property is not an array: ${eventProperty}` };
            }

            const created = (handlers || []).map((input) => {
                const target = getSceneNode(input.targetNodeUuid);
                if (!target) throw new Error(`Event target node not found: ${input.targetNodeUuid}`);
                if (!input.component || !input.handler) throw new Error('Event handler requires component and handler');
                const eventHandler = new EventHandler();
                eventHandler.target = target;
                eventHandler.component = input.component;
                eventHandler.handler = input.handler;
                eventHandler.customEventData = input.customEventData || '';
                return eventHandler;
            });

            if (mode === 'clear') component[eventProperty] = [];
            else if (mode === 'replace') component[eventProperty] = created;
            else component[eventProperty].push(...created);

            return {
                success: true,
                data: {
                    nodeUuid,
                    componentType,
                    eventProperty,
                    mode,
                    handlers: component[eventProperty].map(serializeHandler)
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    },

    getUIEventHandlers(nodeUuid: string, componentType: string, eventProperty?: string | null) {
        try {
            const node = getSceneNode(nodeUuid);
            if (!node) return { success: false, error: `Node not found: ${nodeUuid}` };
            const component = getComponent(node, componentType);
            if (!component) return { success: false, error: `Component not found: ${componentType}` };

            const properties = eventProperty
                ? [eventProperty]
                : Object.keys(component).filter((key) => Array.isArray(component[key]) && /events?$/i.test(key));
            return {
                success: true,
                data: {
                    nodeUuid,
                    componentType,
                    events: properties.map((property) => ({
                        property,
                        handlers: (component[property] || []).map(serializeHandler)
                    }))
                }
            };
        } catch (error: any) {
            return { success: false, error: error?.message || String(error) };
        }
    }
};

export const methods: { [key: string]: (...args: any[]) => any } = {
    ...legacyMethods,
    ...uiMethods
};
