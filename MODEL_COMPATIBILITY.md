# Model compatibility and fast Cocos project workflow

This compatibility update adds a model-neutral MCP transport, provider-specific function schemas, project scaffolding, and executable build tools.

## Endpoints

| Endpoint | Purpose |
| --- | --- |
| `POST /mcp` | MCP Streamable HTTP request/response endpoint |
| `GET /mcp` | Returns `405` because this stateless server does not open a server-initiated SSE stream |
| `GET /manifest` | Lists protocol versions, provider schema endpoints, and authentication mode |
| `GET /v1/tools/openai/responses` | OpenAI Responses API function-tool definitions |
| `GET /v1/tools/openai/chat` | OpenAI Chat Completions function-tool definitions |
| `GET /v1/tools/anthropic` | Anthropic tool definitions |
| `GET /v1/tools/gemini` | Gemini function declarations |
| `POST /v1/tools/call` | Provider-neutral direct tool invocation |

The MCP endpoint supports protocol revisions `2025-06-18`, `2025-03-26`, and `2024-11-05`. It implements initialization, ping, tool discovery, tool calls, structured tool results, notifications, empty resource/prompt lists, JSON-RPC batches for legacy clients, and the required `202 Accepted` response for accepted notifications.

## Server settings

The project file `settings/mcp-server.json` accepts:

```json
{
  "port": 3000,
  "autoStart": true,
  "enableDebugLog": false,
  "allowedOrigins": ["*"],
  "maxConnections": 10,
  "bindAddress": "127.0.0.1",
  "authToken": ""
}
```

Keep `bindAddress` on `127.0.0.1` for normal editor usage. When exposing the server through a secure HTTPS tunnel, configure a non-empty `authToken`; callers then send `Authorization: Bearer <token>`.

## OpenAI Responses API through MCP

OpenAI remote MCP requires a publicly reachable HTTPS URL. Expose the local endpoint through a trusted tunnel or gateway, then use the public `/mcp` URL:

```ts
import OpenAI from 'openai';

const client = new OpenAI();
const response = await client.responses.create({
  model: 'YOUR_OPENAI_MODEL',
  input: 'Create a 2D starter project and prepare a web desktop build.',
  tools: [{
    type: 'mcp',
    server_label: 'cocos_creator',
    server_description: 'Controls the active Cocos Creator project.',
    server_url: 'https://your-secure-domain.example/mcp',
    authorization: process.env.COCOS_MCP_TOKEN,
    require_approval: 'always'
  }]
});
```

For a local application that performs function calling itself, fetch `GET /v1/tools/openai/responses` and pass the returned `tools` array to the Responses API. Execute returned function calls with `POST /v1/tools/call`.

## Other model providers

- Anthropic-compatible schemas: `GET /v1/tools/anthropic`
- Gemini-compatible schemas: `GET /v1/tools/gemini`
- Standard MCP clients: `POST /mcp`

The direct call endpoint accepts common shapes:

```json
{
  "name": "project_quick_start",
  "arguments": {
    "template": "2d",
    "root": "assets/game"
  }
}
```

It also accepts `arguments` as a JSON string and OpenAI Chat Completions' nested `function` shape.

## Fast project creation

Call `project_quick_start` to generate a maintainable starter structure:

```json
{
  "template": "2d",
  "root": "assets/game",
  "overwrite": false,
  "dryRun": false
}
```

Generated assets include:

- `scripts/core/GameConfig.ts`
- `scripts/core/EventBus.ts`
- `scripts/core/GameBootstrap.ts`
- `scripts/components/SceneEntry.ts`
- `data/project-context.json`
- `README.md`

The tool only writes below the project's `assets` directory and rejects path traversal. Use `dryRun: true` to preview changes.

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

Modes:

- `editor`: request a build from the running Cocos Builder.
- `cli`: run the official Cocos Creator command-line build; `creatorPath` is required.
- `auto`: try the editor Builder first, then CLI when `creatorPath` is provided.

A dry run returns the normalized build options and command without starting a build. If execution fails, the tool can open the Build panel and returns the exact CLI command for recovery.

## Security guidance

Tool calls can modify scenes, assets, and build outputs. Keep approval enabled for write/destructive tools, limit enabled tools through the plugin's tool manager, use a bearer token for remote access, validate allowed origins, and never expose an unauthenticated editor endpoint directly to the public Internet.
