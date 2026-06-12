'use strict';

const assert = require('assert');
const {
    toOpenAIResponsesTools,
    toOpenAIChatTools,
    toAnthropicTools,
    toGeminiTools
} = require('../dist/compat/model-tool-formats');

const tools = [{
    name: 'project_quick_start',
    description: 'Create a starter Cocos project structure',
    inputSchema: {
        type: 'object',
        properties: {
            template: { type: 'string', enum: ['2d', '3d', 'minimal'] }
        }
    }
}];

assert.strictEqual(toOpenAIResponsesTools(tools)[0].name, 'project_quick_start');
assert.strictEqual(toOpenAIResponsesTools(tools)[0].strict, false);
assert.strictEqual(toOpenAIChatTools(tools)[0].function.name, 'project_quick_start');
assert.strictEqual(toAnthropicTools(tools)[0].input_schema.type, 'object');
assert.strictEqual(toGeminiTools(tools).functionDeclarations.length, 1);

console.log('Model tool-format compatibility tests passed.');
