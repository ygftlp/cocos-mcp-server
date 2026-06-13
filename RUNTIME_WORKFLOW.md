# Cocos MCP Web Runtime Workflow

The runtime tools let a model build, launch, observe, interact with, and stop a Cocos Creator web build without relying on private Cocos Creator preview-button APIs.

## Supported scope

- Cocos Creator: `>=3.8.6 <3.9.0`
- Build targets: browser-compatible Cocos builds such as `web-desktop` and `web-mobile`
- Browser engines: Google Chrome, Microsoft Edge, or Chromium
- Host binding: loopback only (`127.0.0.1`, `localhost`, or `::1` inputs are normalized to a local-only session)
- Protocol: Chrome DevTools Protocol through an isolated temporary browser profile

The runtime harness does not control Cocos Creator's private Preview UI, native simulator, or physical mobile devices.

## MCP tools

### `runtime_session`

Actions:

- `start`: serve a completed web build and start Chromium
- `status`: inspect the current session
- `reload`: reload the game page
- `stop`: close CDP, terminate Chromium, close the server, and remove the temporary browser profile

Example:

```json
{
  "action": "start",
  "params": {
    "buildPath": "build/web-desktop",
    "headless": true,
    "width": 1280,
    "height": 720,
    "startupTimeoutMs": 30000
  }
}
```

`buildPath` may be absolute or relative to the Cocos project. When omitted, the adapter checks common Cocos build directories.

`browserPath` may be supplied explicitly. Otherwise the adapter searches common Chrome, Edge, and Chromium locations and executable names.

### `runtime_observe`

Actions:

- `evaluate`: evaluate JavaScript in the game page
- `wait_for`: poll a JavaScript expression until it becomes truthy
- `screenshot`: capture the viewport or full page
- `logs`: read console, exception, network, browser process, and JavaScript dialog events

Evaluate example:

```json
{
  "action": "evaluate",
  "params": {
    "expression": "document.querySelector('canvas') !== null",
    "awaitPromise": true
  }
}
```

Wait example:

```json
{
  "action": "wait_for",
  "params": {
    "expression": "document.readyState === 'complete' && document.querySelector('canvas')",
    "timeoutMs": 15000,
    "intervalMs": 100
  }
}
```

Screenshot example:

```json
{
  "action": "screenshot",
  "params": {
    "format": "png",
    "filePath": "main-menu.png",
    "fullPage": false,
    "returnBase64": false
  }
}
```

Screenshot files are restricted to:

```text
<project>/.cocos-mcp/runtime-artifacts/
```

Log example:

```json
{
  "action": "logs",
  "params": {
    "sinceSequence": 0,
    "levels": ["warning", "error"],
    "limit": 500
  }
}
```

Use the returned `nextSequence` for incremental log reads.

### `runtime_input`

Actions:

- `mouse`: move, press, release, click, or wheel
- `keyboard`: key down, key up, character input, or press
- `touch`: touch start, move, end, or tap

Mouse example:

```json
{
  "action": "mouse",
  "params": {
    "type": "click",
    "x": 640,
    "y": 360,
    "button": "left"
  }
}
```

Keyboard example:

```json
{
  "action": "keyboard",
  "params": {
    "type": "press",
    "key": " ",
    "code": "Space"
  }
}
```

Touch example:

```json
{
  "action": "touch",
  "params": {
    "type": "tap",
    "points": [
      { "x": 320, "y": 480, "id": 0 }
    ]
  }
}
```

## Recommended model loop

1. Create or update the game using project, scene, node, component, UI, asset, and prefab tools.
2. Build `web-desktop` with `project_build`.
3. Start the build with `runtime_session.start`.
4. Read initial logs and wait for the canvas or a project-specific readiness condition.
5. Send player input with `runtime_input`.
6. Inspect state with `runtime_observe.evaluate` or a project-provided test hook.
7. Capture a screenshot and read incremental logs.
8. Stop the runtime before rebuilding.
9. Fix the game and repeat.

## Project-specific test hooks

A production project should expose a narrow, read-only test surface instead of asking the model to inspect minified engine internals. For example:

```ts
interface GameTestBridge {
    ready: boolean;
    scene: string;
    score: number;
    player: { x: number; y: number; alive: boolean };
}

(window as any).__COCOS_MCP_TEST__ = {
    getState(): GameTestBridge {
        return {
            ready: true,
            scene: 'Main',
            score: gameState.score,
            player: {
                x: player.position.x,
                y: player.position.y,
                alive: player.alive
            }
        };
    }
};
```

The model can then evaluate:

```js
window.__COCOS_MCP_TEST__?.getState()
```

and wait for deterministic conditions such as:

```js
window.__COCOS_MCP_TEST__?.getState().score >= 10
```

Do not expose secrets, authentication tokens, payment data, or unrestricted file/network operations through the test bridge.

## Security properties

- Runtime HTTP and debugger endpoints bind only to the local machine.
- Browser sessions use a new temporary user-data directory.
- Runtime shutdown removes the temporary browser profile.
- `--remote-debugging-*` and `--user-data-dir` cannot be overridden through extra arguments.
- Static-file paths are resolved inside the selected build root and traversal attempts are rejected.
- Screenshot output is restricted to the project's runtime-artifact directory.
- The harness does not add a third-party browser-automation dependency.

## Current limitations

- A web build must already exist before `runtime_session.start`.
- The harness does not currently trigger the Cocos build automatically.
- Native, simulator, and physical-device execution are outside this adapter.
- Visual understanding is supplied by the model consuming the screenshot; the runtime adapter only captures it.
- Application-specific gameplay assertions should use a project test hook or stable DOM/canvas conditions.
- Browser availability differs by machine; pass `browserPath` when automatic discovery is insufficient.
