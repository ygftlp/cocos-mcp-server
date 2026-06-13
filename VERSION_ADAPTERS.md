# Cocos Creator version isolation

## Decision

The project uses one shared MCP/domain core and isolated Cocos Creator adapters. It does **not** fork the whole repository for every Creator line.

Current release policy:

| Adapter | Creator range | Level | Editor tools |
| --- | --- | --- | --- |
| `creator-38x` | `>=3.8.6 <3.9.0` | stable | enabled by capability |
| `creator-39x` | `>=3.9.0 <3.10.0` | preview placeholder | disabled; diagnostics only |
| `unsupported` | every other/unknown version | unsupported | disabled; diagnostics only |

The root extension manifest remains a 3.8.x stable package until the 3.9 adapter passes real-editor contract tests. A future 3.9 preview/stable release should be built as a separate artifact with its own `editor` range; an untested range must not be added to the stable package manifest.

## Layers

```text
source/
  adapters/
    contracts.ts          stable adapter and capability contracts
    base-adapter.ts       common Editor bridge
    capabilities.ts       named capability sets
    creator-38x.ts        tested 3.8 implementation/profile
    creator-39x.ts        fail-closed preview profile
    unsupported.ts        fail-closed fallback
    selector.ts           version detection and adapter selection

  tools/
    core-*.ts             MCP/domain tools
    core-compatibility-tools.ts

  mcp-protocol.ts         model-neutral MCP protocol
  mcp-server.ts           HTTP transport and compatibility endpoints
```

Long-term domain contracts should be split further into:

```text
adapters/contracts/
  scene-adapter.ts
  node-adapter.ts
  component-adapter.ts
  ui-adapter.ts
  prefab-adapter.ts
  asset-adapter.ts
  build-adapter.ts
```

Every direct `Editor.*` call should progressively move behind those contracts. The first implemented phase is the compatibility firewall: one adapter is selected at startup, tools declare required capabilities, and unsupported tools never enter MCP `tools/list`.

## Fail-closed behavior

Unknown and preview versions expose only:

- `compatibility_info`
- `compatibility_check`
- MCP resource `cocos://compatibility`
- HTTP `/health`, `/manifest`, and authenticated `/capabilities`

Scene, node, UI, prefab, asset, project, build, preference, debug, and other editor tools are omitted. Direct calls to omitted tools fail before reaching the Editor API.

This policy prevents a newer Creator version from silently executing write operations through an adapter that has not been validated.

## Capability model

Tools normally require a capability derived from their category and operation kind:

```text
scene.read
scene.write
node.read
node.write
ui.read
ui.write
asset.read
asset.write
project.read
project.write
```

Cross-domain tools declare explicit requirements. For example:

```text
project_quick_start
  project.write
  asset.write

project_create_game
  project.write
  asset.write
  scene.write
  node.write
  component.write
  ui.write

project_build
  project.build
```

An adapter may support only part of a version line without enabling unrelated tools.

## Discovery

Models and clients can inspect compatibility before planning changes:

### MCP tool

```json
{
  "name": "compatibility_info",
  "arguments": {}
}
```

### MCP resource

```text
cocos://compatibility
```

### HTTP

```text
GET /capabilities
GET /manifest
GET /health
```

The report includes adapter ID, detected Creator version, support level, version range, write policy, capability map, available tool count, and tools disabled by missing capabilities.

## Adding a new version line

1. Add `creator-<line>.ts` implementing the adapter contract.
2. Start with diagnostic-only capabilities.
3. Run shared contract tests for every domain.
4. Run real Cocos Creator integration tests on Windows and macOS.
5. Enable read capabilities one domain at a time.
6. Enable write capabilities only after rollback and persistence tests pass.
7. Produce a separate preview package manifest for that version range.
8. Promote to stable only after the published compatibility matrix passes.

Do not copy core MCP logic, schemas, security, or tool orchestration into a version adapter.

## Commercial release rule

A version adapter can be marked `stable` only when all of the following pass:

- Type compatibility against the minimum and latest patch in the line.
- Real-editor create/read/update/delete contract tests.
- Scene save, close, reopen, and persistence verification.
- Prefab and serialized reference verification.
- Web build smoke test.
- Windows and macOS extension installation tests.
- Failure injection and rollback tests for destructive operations.
- Upgrade tests from the previous plugin release.

Until then it must remain `preview` with writes disabled by default.
