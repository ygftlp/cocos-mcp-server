// Shared helpers to validate and dispatch action-based tool calls.
import { ToolExecutor, ToolResponse } from '../types';

export type ActionHandler = { executor: ToolExecutor; method: string };
export type ToolActionMap = Record<string, Record<string, ActionHandler>>;

export function buildActionSchema(actions: string[], paramsDescription: string): any {
    return {
        type: 'object',
        properties: {
            action: {
                type: 'string',
                description: 'Action to perform',
                enum: actions
            },
            params: {
                type: 'object',
                description: paramsDescription,
                default: {}
            }
        },
        required: ['action']
    };
}

export function resolveAction(args: any): string | null {
    if (!args || typeof args !== 'object') return null;
    if (typeof args.action === 'string') return args.action;
    return null;
}

export function resolveParams(args: any): any {
    if (!args || typeof args !== 'object') return {};
    if (args.params && typeof args.params === 'object') {
        return args.params;
    }
    const { action, ...rest } = args;
    return rest;
}

export async function executeAction(toolName: string, args: any, map: ToolActionMap): Promise<ToolResponse> {
    const toolActions = map[toolName];
    if (!toolActions) {
        throw new Error(`Unknown tool: ${toolName}`);
    }

    let action = resolveAction(args);
    if (!action) {
        const available = Object.keys(toolActions);
        if (available.length === 1) {
            action = available[0];
        } else {
            throw new Error(`Missing action. Available actions: ${available.join(', ')}`);
        }
    }

    const handler = toolActions[action];
    if (!handler) {
        throw new Error(`Unknown action '${action}'. Available actions: ${Object.keys(toolActions).join(', ')}`);
    }

    const params = resolveParams(args);
    return handler.executor.execute(handler.method, params);
}
