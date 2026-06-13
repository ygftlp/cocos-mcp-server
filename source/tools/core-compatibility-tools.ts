import { CocosAdapter, capabilityEnabled } from '../adapters/contracts';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';

export class CompatibilityCoreTools implements ToolExecutor {
    constructor(private readonly adapter: CocosAdapter) {}

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'info',
                title: 'Cocos compatibility information',
                description: 'Return the selected version adapter, support level, version range, write policy, and capability map.',
                inputSchema: { type: 'object', properties: {}, additionalProperties: false },
                xCocos: {
                    kind: 'read',
                    destructive: false,
                    sideEffect: false,
                    cost: 'low',
                    scope: ['system'],
                    requires: ['compatibility.read']
                }
            },
            {
                name: 'check',
                title: 'Check Cocos adapter capabilities',
                description: 'Check whether the active Cocos version adapter provides all capabilities required by a planned operation.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        capabilities: {
                            type: 'array',
                            minItems: 1,
                            maxItems: 100,
                            items: { type: 'string', minLength: 1 }
                        }
                    },
                    required: ['capabilities'],
                    additionalProperties: false
                },
                xCocos: {
                    kind: 'read',
                    destructive: false,
                    sideEffect: false,
                    cost: 'low',
                    scope: ['system'],
                    requires: ['compatibility.read']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        if (toolName === 'info') {
            return { success: true, data: { ...this.adapter.profile } };
        }
        if (toolName === 'check') {
            const requested = Array.isArray(args?.capabilities)
                ? Array.from(new Set(args.capabilities.filter((item: any) => typeof item === 'string' && item.trim()).map((item: string) => item.trim())))
                : [];
            if (!requested.length) return { success: false, error: 'capabilities must be a non-empty string array' };
            const missing = requested.filter((capability: string) => !capabilityEnabled(this.adapter.profile, capability));
            return {
                success: missing.length === 0,
                data: {
                    adapterId: this.adapter.profile.adapterId,
                    creatorVersion: this.adapter.profile.creatorVersion,
                    requested,
                    supported: requested.filter((capability: string) => !missing.includes(capability)),
                    missing
                },
                ...(missing.length ? { error: `Missing capabilities: ${missing.join(', ')}` } : {})
            };
        }
        throw new Error(`Unknown compatibility tool: ${toolName}`);
    }
}
