import { RuntimeAdapter } from '../adapters/contracts/runtime-adapter';
import { selectCocosAdapter } from '../adapters/selector';
import { ToolDefinition, ToolExecutor, ToolResponse } from '../types';
import { buildActionSchema, executeAction, ToolActionMap } from './core-action-utils';
import { RuntimeTools } from './runtime-tools';

export class RuntimeCoreTools implements ToolExecutor {
    private readonly runtime: RuntimeTools;
    private readonly actions: ToolActionMap;

    constructor(adapter: RuntimeAdapter = selectCocosAdapter().runtime) {
        this.runtime = new RuntimeTools(adapter);
        this.actions = {
            session: {
                start: { executor: this.runtime, method: 'runtime_start' },
                status: { executor: this.runtime, method: 'runtime_status' },
                reload: { executor: this.runtime, method: 'runtime_reload' },
                stop: { executor: this.runtime, method: 'runtime_stop' }
            },
            observe: {
                evaluate: { executor: this.runtime, method: 'runtime_evaluate' },
                wait_for: { executor: this.runtime, method: 'runtime_wait_for' },
                screenshot: { executor: this.runtime, method: 'runtime_screenshot' },
                logs: { executor: this.runtime, method: 'runtime_logs' }
            },
            input: {
                mouse: { executor: this.runtime, method: 'runtime_mouse' },
                keyboard: { executor: this.runtime, method: 'runtime_keyboard' },
                touch: { executor: this.runtime, method: 'runtime_touch' }
            }
        };
    }

    getTools(): ToolDefinition[] {
        return [
            {
                name: 'session',
                title: 'Control the built Cocos game runtime',
                description: 'Start, inspect, reload, or stop a loopback-only Chromium session for a Cocos web build.',
                inputSchema: buildActionSchema(this.actions.session, 'Runtime session parameters'),
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'high', scope: ['runtime'],
                    requires: ['runtime.write']
                }
            },
            {
                name: 'observe',
                title: 'Observe and assert the running Cocos game',
                description: 'Evaluate JavaScript, wait for conditions, capture screenshots, and read browser/game logs.',
                inputSchema: buildActionSchema(this.actions.observe, 'Runtime observation parameters'),
                xCocos: {
                    kind: 'read', destructive: false, sideEffect: false, cost: 'medium', scope: ['runtime'],
                    requires: ['runtime.read']
                }
            },
            {
                name: 'input',
                title: 'Send player input to the running Cocos game',
                description: 'Dispatch mouse, keyboard, and touch input through the Chrome DevTools Protocol.',
                inputSchema: buildActionSchema(this.actions.input, 'Runtime input parameters'),
                xCocos: {
                    kind: 'write', destructive: false, sideEffect: true, cost: 'low', scope: ['runtime'],
                    requires: ['runtime.write']
                }
            }
        ];
    }

    async execute(toolName: string, args: any): Promise<ToolResponse> {
        return executeAction(toolName, args, this.actions);
    }
}
