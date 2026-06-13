'use strict';

const assert = require('assert');
const {
    toOpenAIResponsesTools,
    toOpenAIChatTools,
    toAnthropicTools,
    toGeminiTools
} = require('../dist/compat/model-tool-formats');
const { UICoreTools } = require('../dist/tools/core-ui-tools');

const uiElement = new UICoreTools().getTools().find((tool) => tool.name === 'element');
assert.ok(uiElement, 'ui_element definition must exist');
const tools = [{ ...uiElement, name: 'ui_element' }];

const responses = toOpenAIResponsesTools(tools)[0];
assert.strictEqual(responses.name, 'ui_element');
assert.ok(Array.isArray(responses.parameters.oneOf));

const chat = toOpenAIChatTools(tools)[0];
assert.ok(Array.isArray(chat.function.parameters.oneOf));

const anthropic = toAnthropicTools(tools)[0];
assert.ok(Array.isArray(anthropic.input_schema.oneOf));

const gemini = toGeminiTools(tools).functionDeclarations[0];
assert.ok(Array.isArray(gemini.parameters.oneOf));

console.log('UI model-format compatibility tests passed.');
