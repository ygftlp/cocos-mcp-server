import { ToolExecutor, ToolResponse } from '../types';
import { JsonSchema, schemaForMethod } from './core-action-schemas';

export type ActionHandler = { executor: ToolExecutor; method: string };
export type ActionGroup = Record<string, ActionHandler>;
export type ToolActionMap = Record<string, ActionGroup>;

export function buildActionSchema(actions: string[] | ActionGroup, paramsDescription: string): JsonSchema {
    const entries = Array.isArray(actions)
        ? actions.map((action) => ({ action, method: action }))
        : Object.entries(actions).map(([action, handler]) => ({ action, method: handler.method }));

    return {
        oneOf: entries.map(({ action, method }) => {
            const params = schemaForMethod(method);
            return {
                type: 'object',
                title: action,
                properties: {
                    action: { type: 'string', enum: [action], description: `Execute the ${action} action` },
                    params: { ...params, description: params.description || paramsDescription }
                },
                required: ['action'],
                additionalProperties: false
            };
        })
    };
}

export function resolveAction(args: any): string | null {
    return args && typeof args === 'object' && typeof args.action === 'string' ? args.action : null;
}

export function resolveParams(args: any): any {
    if (!args || typeof args !== 'object') return {};
    if (args.params && typeof args.params === 'object' && !Array.isArray(args.params)) return args.params;
    const { action, ...rest } = args;
    return rest;
}

export async function executeAction(toolName: string, args: any, map: ToolActionMap): Promise<ToolResponse> {
    const toolActions = map[toolName];
    if (!toolActions) throw new Error(`Unknown tool: ${toolName}`);

    let action = resolveAction(args);
    if (!action) {
        const available = Object.keys(toolActions);
        if (available.length === 1) action = available[0];
        else throw new Error(`Missing action. Available actions: ${available.join(', ')}`);
    }

    const handler = toolActions[action];
    if (!handler) throw new Error(`Unknown action '${action}'. Available actions: ${Object.keys(toolActions).join(', ')}`);
    return handler.executor.execute(handler.method, resolveParams(args));
}
