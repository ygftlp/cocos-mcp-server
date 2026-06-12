import { ToolDefinition } from '../types';

export type ModelToolProvider = 'openai-responses' | 'openai-chat' | 'anthropic' | 'gemini';

function normalizeInputSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') {
        return { type: 'object', properties: {} };
    }

    const normalized = { ...schema };
    if (!normalized.type) normalized.type = 'object';
    if (normalized.type === 'object' && !normalized.properties) normalized.properties = {};
    return normalized;
}

export function toOpenAIResponsesTools(tools: ToolDefinition[]): any[] {
    return tools.map((tool) => ({
        type: 'function',
        name: tool.name,
        description: tool.description,
        parameters: normalizeInputSchema(tool.inputSchema),
        strict: false
    }));
}

export function toOpenAIChatTools(tools: ToolDefinition[]): any[] {
    return tools.map((tool) => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: normalizeInputSchema(tool.inputSchema),
            strict: false
        }
    }));
}

export function toAnthropicTools(tools: ToolDefinition[]): any[] {
    return tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: normalizeInputSchema(tool.inputSchema)
    }));
}

export function toGeminiTools(tools: ToolDefinition[]): any {
    return {
        functionDeclarations: tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: normalizeInputSchema(tool.inputSchema)
        }))
    };
}

export function formatToolsForProvider(provider: ModelToolProvider, tools: ToolDefinition[]): any {
    switch (provider) {
        case 'openai-responses':
            return toOpenAIResponsesTools(tools);
        case 'openai-chat':
            return toOpenAIChatTools(tools);
        case 'anthropic':
            return toAnthropicTools(tools);
        case 'gemini':
            return toGeminiTools(tools);
        default:
            return tools;
    }
}
