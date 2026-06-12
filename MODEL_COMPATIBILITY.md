# Model compatibility and fast Cocos project workflow

The plugin exposes a model-neutral MCP transport, provider-specific function schemas, project scaffolding, and build tools.

## Supported Cocos Creator versions

The extension package range is `>=3.8.6 <3.9.0`.

CI compiles and runs contract tests against:

- `@cocos/creator-types@3.8.6` — minimum supported version.
- `@cocos/creator-types@3.8` — the newest published 3.8.x type package resolved by npm.

This is source/API compatibility testing. Editor integration tests should still be run in an installed Cocos Creator 3.8.6 project and the newest available 3.8.x editor before a release.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /mcp` | MCP Streamable HTTP request/response endpoint |
| `GET /manifest` | Protocol versions, provider schema endpoints, and authentication mode |
| `GET /v1/tools/openai/responses` | OpenAI Responses API function-tool definitions |
| `GET /v1/tools/openai/chat` | OpenAI Chat Completions function-tool definitions |
| `GET /v1/tools/anthropic` | Anthropic tool definitions |
| `GET /v1/tools/gemini` | Gemini function declarations |
| `POST /v1/tools/call` | Provider-neutral direct tool invocation |

## Secure defaults

The project file `settings/mcp-server.json` is created automatically. A random bearer token is generated when the file is first created or when an old configuration has an empty token.

```json
{
  "port": 3000,
  "autoStart": false,
  "enableDebugLog": false,
  "allowedOrigins": ["http://127.0.0.1:0"],
  "maxConnections": 10,
  "bindAddress": "127.0.0.1",
  "authToken": "generated-random-token"
}
```

Native and CLI MCP clients normally send no `Origin` header. The default sentinel origin matches no normal browser page. Browser requests are rejected unless their exact origin is explicitly listed in `allowedOrigins`. Binding to a non-loopback address requires a non-empty token.

Callers send:

```text
Authorization: Bearer <token from settings/mcp-server.json>
```

Do not expose the editor endpoint directly to the public Internet. Put remote access behind HTTPS and keep model approval enabled for write/destructive tools.

## Tool configuration semantics

- An omitted tool filter means “use registry defaults”.
- An empty enabled-tool list means “disable every tool”.
- Existing enable/disable choices survive upgrades.
- Newly introduced tools use their registry default instead of being silently disabled.

Placeholder and unsafe public entries have been removed, including simulated broadcast capture, preview-server control, arbitrary scene script execution, unsupported dependency/compression analysis, preferences import, and the simulated prefab-create path.

## Action schemas

Fusion tools expose one JSON Schema branch per action. Each branch selects exactly one action and documents the parameters required by the underlying Cocos operation. Calls should use:

```json
{
  "action": "create",
  "params": {
    "name": "Player",
    "parentUuid": "optional-parent-uuid"
  }
}
```

## Fast project creation

Call `project_quick_start`:

```json
{
  "template": "2d",
  "root": "assets/game",
  "overwrite": false,
  "dryRun": false
}
```

The tool writes only under the project `assets` directory and rejects traversal outside it.

## Automated build

Call `project_build`:

```json
{
  "platform": "web-desktop",
  "mode": "auto",
  "debug": true,
  "outputName": "web-preview"
}
```

- `editor`: request a build from the running Cocos Builder.
- `cli`: run the Cocos Creator executable; `creatorPath` is required.
- `auto`: try the editor Builder first and then CLI when `creatorPath` is supplied.

## Regression checks

```bash
npm test
```

The test suite compiles TypeScript, checks provider schemas, verifies empty-whitelist behavior, configuration migration, generated authentication tokens, per-action schemas, bounded batch execution, cache invalidation, and removal of unsupported public tools. Generated `dist/` files are test artifacts and are not committed.
