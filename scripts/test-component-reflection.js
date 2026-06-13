'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ComponentCoreTools } = require('../dist/tools/core-component-tools');
const { ComponentReflectionTools } = require('../dist/tools/component-reflection-tools');

function nodeDump() {
    return {
        uuid: { value: 'node-1' },
        __comps__: [{
            __type__: 'PlayerController',
            uuid: { value: 'component-1' },
            enabled: { type: 'Boolean', value: true },
            speed: { type: 'Float', value: 5, min: 0, max: 10, step: 0.5 },
            mode: {
                type: 'Enum',
                value: 1,
                enumList: [
                    { name: 'Idle', value: 0 },
                    { name: 'Run', value: 1 }
                ]
            },
            target: { type: 'cc.Node', value: { uuid: 'target-1' } },
            icon: { type: 'cc.SpriteFrame', extends: 'cc.SpriteFrame', value: { uuid: 'asset-1' } },
            tags: { type: 'Array', value: ['player', 'controllable'] },
            config: {
                type: 'Object',
                value: {
                    lives: { type: 'Integer', value: 3, min: 1, max: 9 },
                    title: { type: 'String', value: 'Hero' }
                }
            },
            locked: { type: 'Float', value: 1, readonly: true },
            hiddenValue: { type: 'String', value: 'secret', visible: false }
        }]
    };
}

async function main() {
    const writes = [];
    const component = {
        createComponent: async () => undefined,
        removeComponent: async () => undefined,
        queryNode: async (uuid) => {
            if (uuid === 'other-node') {
                return { __comps__: [{ __type__: 'TargetComponent', uuid: { value: 'target-component-uuid' } }] };
            }
            return nodeDump();
        },
        setSerializedProperty: async (request) => writes.push(request)
    };
    const scene = {
        queryComponents: async () => ['cc.Sprite', { name: 'PlayerController', displayName: 'Player Controller' }],
        queryClasses: async () => [{ name: 'PlayerController', category: 'scripts' }, { name: 'EnemyController' }],
        queryComponentHasScript: async (name) => !name.startsWith('cc.')
    };

    const tools = new ComponentReflectionTools(component, scene);

    const classes = await tools.execute('list_component_classes', {
        includeScriptStatus: true,
        includeBuiltin: true,
        includeProject: true
    });
    assert.strictEqual(classes.success, true);
    assert.strictEqual(classes.data.classes.length, 3);
    const player = classes.data.classes.find((item) => item.name === 'PlayerController');
    assert.strictEqual(player.builtin, false);
    assert.deepStrictEqual(player.sources.sort(), ['classes', 'components']);
    assert.strictEqual(player.hasScript, true);

    const projectOnly = await tools.execute('list_component_classes', {
        includeBuiltin: false,
        includeProject: true,
        filter: 'controller'
    });
    assert.deepStrictEqual(projectOnly.data.classes.map((item) => item.name), ['EnemyController', 'PlayerController']);

    const schema = await tools.execute('get_component_schema', {
        nodeUuid: 'node-1',
        componentType: 'PlayerController',
        includeValues: true,
        includeHidden: false
    });
    assert.strictEqual(schema.success, true);
    assert.strictEqual(schema.data.properties.speed.valueType, 'number');
    assert.strictEqual(schema.data.properties.speed.minimum, 0);
    assert.strictEqual(schema.data.properties.speed.maximum, 10);
    assert.strictEqual(schema.data.properties.mode.enumValues[1].name, 'Run');
    assert.strictEqual(schema.data.properties.target.valueType, 'reference');
    assert.strictEqual(schema.data.properties.icon.valueType, 'asset');
    assert.strictEqual(schema.data.properties.config.children.lives.valueType, 'number');
    assert.strictEqual(schema.data.properties.hiddenValue, undefined);

    const hiddenSchema = await tools.execute('get_component_schema', {
        nodeUuid: 'node-1', componentType: 'PlayerController', includeHidden: true
    });
    assert.strictEqual(hiddenSchema.data.properties.hiddenValue.visible, false);

    const valid = await tools.execute('validate_component_properties', {
        nodeUuid: 'node-1',
        componentType: 'PlayerController',
        properties: {
            speed: 8,
            mode: 1,
            target: { $node: 'target-2' },
            icon: { $asset: 'asset-2' },
            tags: ['hero'],
            'config.lives': 5,
            'config.title': 'Champion'
        }
    });
    assert.strictEqual(valid.success, true);
    assert.strictEqual(valid.data.issueCount, 0);

    const invalid = await tools.execute('validate_component_properties', {
        nodeUuid: 'node-1',
        componentType: 'PlayerController',
        properties: {
            speed: 20,
            mode: 99,
            tags: 'not-array',
            locked: 2,
            missingProperty: true
        }
    });
    assert.strictEqual(invalid.success, false);
    const codes = invalid.data.issues.map((issue) => issue.code);
    assert.ok(codes.includes('maximum'));
    assert.ok(codes.includes('enum'));
    assert.ok(codes.includes('type-mismatch'));
    assert.ok(codes.includes('readonly-property'));
    assert.ok(codes.includes('unknown-property'));

    const dryRun = await tools.execute('set_component_properties', {
        nodeUuid: 'node-1',
        componentType: 'PlayerController',
        dryRun: true,
        properties: {
            speed: 7,
            target: { $node: 'target-3' }
        }
    });
    assert.strictEqual(dryRun.success, true);
    assert.strictEqual(dryRun.data.updateCount, 2);
    assert.strictEqual(writes.length, 0);
    assert.strictEqual(dryRun.data.updates[0].dump.type, 'Float');

    const applied = await tools.execute('set_component_properties', {
        nodeUuid: 'node-1',
        componentType: 'PlayerController',
        properties: {
            speed: 6,
            target: { $node: 'target-4' },
            icon: { $asset: 'asset-4' },
            'config.lives': 4,
            customTarget: { $component: { nodeUuid: 'other-node', type: 'TargetComponent' } }
        },
        allowUnknown: true
    });
    assert.strictEqual(applied.success, true);
    assert.strictEqual(writes.length, 5);
    assert.strictEqual(writes[0].path, '__comps__.0.speed');
    assert.strictEqual(writes[0].dump.type, 'Float');
    assert.deepStrictEqual(writes[1].dump.value, { uuid: 'target-4' });
    assert.deepStrictEqual(writes[2].dump.value, { uuid: 'asset-4' });
    assert.strictEqual(writes[3].path, '__comps__.0.config.lives');
    assert.deepStrictEqual(writes[4].dump.value, { uuid: 'target-component-uuid' });

    const core = new ComponentCoreTools(component, scene);
    const definitions = core.getTools();
    const reflection = definitions.find((tool) => tool.name === 'reflection');
    assert.ok(reflection, 'component_reflection tool must be exposed');
    assert.strictEqual(reflection.xCocos.kind, 'read');
    const reflectionActions = reflection.inputSchema.oneOf.map((entry) => entry.title).sort();
    assert.deepStrictEqual(reflectionActions, ['list_classes', 'schema', 'validate']);
    const property = definitions.find((tool) => tool.name === 'property');
    assert.ok(property.inputSchema.oneOf.some((entry) => entry.title === 'set_many'));

    const source = fs.readFileSync(path.join(__dirname, '..', 'source', 'tools', 'component-reflection-tools.ts'), 'utf8');
    assert.strictEqual(source.includes('Editor.Message'), false, 'reflection tools must not call Editor.Message directly');

    console.log('Dynamic component reflection and validation tests passed.');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
