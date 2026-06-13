# Cocos MCP Plugin-Native Playtest Workflow

`cocos-mcp-server` runs as a Cocos Creator extension. The extension now participates in three Creator processes:

- `main`: MCP server, tool registry, build/run orchestration, and lifecycle cleanup
- `scene`: scene, node, component, prefab, and UI operations through Creator's scene process
- `builder`: Creator Build Extension hooks, including post-build runtime-bridge injection

The browser process used for a web playtest is a child runtime launched and owned by the Creator extension. It is not a replacement for the extension host.

## Supported scope

- Cocos Creator: `>=3.8.6 <3.9.0`
- Plugin-native build orchestration through Creator Builder
- Automated playtest targets: `web-desktop` and `web-mobile`
- Browser engines: Google Chrome, Microsoft Edge, or Chromium
- Host binding: loopback only
- Protocol: Chrome DevTools Protocol through an isolated temporary browser profile

Native platforms can still be built through `project_build`. Automated installation and input control on simulators or physical devices belong to separate platform adapters because Android, iOS, Windows, macOS, and mini-game platforms have different deployment and debugging protocols.

## One-call Creator playtest

Use `project_playtest` for the normal model workflow. It performs one transaction inside the enabled Creator extension:

1. Stop the previous playtest session.
2. Check the Creator Builder worker.
3. Build the current project through Creator Builder.
4. Let the extension's `onAfterBuild` hook inject the runtime test bridge.
5. Start the generated web build.
6. Wait for the game and canvas or a supplied readiness expression.
7. Capture a screenshot as a standard MCP `image` content block.
8. Read runtime logs and fail the transaction when error logs are present.
9. Stop the runtime automatically when a later stage fails and rollback is enabled.

Example:

```json
{
  "platform": "web-desktop",
  "mode": "editor",
  "debug": true,
  "headless": true,
  "width": 1280,
  "height": 720,
  "readyTimeoutMs": 30000,
  "captureScreenshot": true,
  "failOnRuntimeError": true,
  "rollbackOnFailure": true
}
```

The result contains:

- transaction ID
- Creator build result
- runtime session details
- readiness result
- screenshot metadata
- MCP image content for vision-capable clients
- runtime logs and error count
- per-stage status, timestamps, duration, and failure details

## Automatic build bridge

The package declares:

```json
{
  "contributions": {
    "builder": "./dist/builder"
  }
}
```

The builder contribution registers an `onAfterBuild` hook for Creator builds. For web builds, the hook:

- locates the generated `index.html`
- writes `cocos-mcp-test-bridge.js`
- injects the bridge before the game scripts load
- writes `.cocos-mcp-runtime.json` build metadata
- remains idempotent when the same output is rebuilt

The injected global API is:

```js
globalThis.__COCOS_MCP_TEST__
```

It is available automatically. A game does not need to create the bridge itself.

### Generic state

```js
__COCOS_MCP_TEST__.getState()
```

returns generic runtime information including:

- page readiness
- URL and document title
- page visibility
- canvas dimensions
- published game state
- captured error count and last error
- bridge event sequence

### Semantic game state

Game scripts may optionally publish domain state:

```ts
(globalThis as any).__COCOS_MCP_TEST__?.publish('game', {
    scene: 'Main',
    score: this.score,
    playerAlive: this.playerAlive
});
```

The bridge is automatic; publishing semantic values is optional and is only needed when a test must understand game-specific concepts such as score, inventory, quest state, or AI mode.

A model can then use:

```js
__COCOS_MCP_TEST__.get('game')
```

or wait for:

```js
__COCOS_MCP_TEST__.get('game')?.score >= 10
```

## Direct runtime tools

`runtime_session` remains available for multi-step debugging:

- `start`
- `status`
- `reload`
- `stop`

`runtime_observe` supports:

- `evaluate`
- `wait_for`
- `screenshot`
- `logs`

`runtime_input` supports:

- mouse move, press, release, click, and wheel
- keyboard down, up, character input, and press
- touch start, move, end, and tap

## MCP image output

Runtime screenshots are returned in two forms:

1. A file under:

```text
<project>/.cocos-mcp/runtime-artifacts/
```

2. A standard MCP content item:

```json
{
  "type": "image",
  "data": "<base64>",
  "mimeType": "image/png"
}
```

Vision-capable MCP clients can therefore inspect the screenshot directly. The model does not need to open a local file path manually.

## Extension lifecycle

The extension exposes Creator messages:

- `run-playtest`
- `stop-playtest`

When the extension unloads, it closes the CDP connection, terminates its browser child process, closes the local server, and removes the temporary browser profile.

## Security properties

- Runtime HTTP and debugger endpoints bind only to the local machine.
- Browser sessions use a new temporary user-data directory.
- Runtime shutdown removes the temporary browser profile.
- `--remote-debugging-*` and `--user-data-dir` cannot be overridden through extra arguments.
- Static-file paths are resolved inside the selected build root and traversal attempts are rejected.
- Screenshot output is restricted to the project's runtime-artifact directory.
- The bridge records runtime data but does not expose file access, credentials, payment data, or unrestricted network APIs.
- The harness does not add a third-party browser-automation dependency.

## Native platform boundary

The plugin can invoke Creator builds for supported native and mini-game platforms. Automated execution is intentionally separated by platform:

- Android requires ADB/device or emulator integration.
- iOS requires Xcode, Simulator, signing, and macOS host integration.
- Windows and macOS native builds require executable process and native debugging adapters.
- WeChat, Douyin, and other mini-game platforms require their own developer tools and automation interfaces.

These are future runtime adapters, not evidence that the MCP server is external to Creator. The current `creator-38x` web runtime adapter is the first implementation of the versioned runtime domain.
