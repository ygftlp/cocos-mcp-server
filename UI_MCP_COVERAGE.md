# Cocos UI MCP coverage

## Meaning of “every UI element”

This repository distinguishes two different surfaces:

1. **Game/runtime UI** — scene nodes and Cocos components that become part of the game. These are addressed through MCP tools and are the guaranteed coverage target.
2. **Cocos Creator editor chrome** — the editor's own menus, tabs, dialogs, DOM controls, and private panel buttons. Cocos does not publish a stable API for every visible editor control. The plugin exposes only documented message, panel, scene, asset, preference, build, and project APIs; it does not use brittle screen-coordinate or DOM automation.

MCP defines tool discovery, schemas, calls, and results. It does not itself guarantee control of a product's UI. Coverage is therefore enforced by the catalog, generic serialized-property operations, event operations, validation, and regression tests below.

## MCP tools

| Tool | Purpose |
| --- | --- |
| `ui_catalog` | Enumerate supported Cocos 3.8 UI/2D component classes, aliases, dependencies, and event fields. |
| `ui_query` | Scan the scene, inspect a UI node, or derive the serialized property schema of an existing component. |
| `ui_element` | Create/delete/duplicate UI nodes, add/remove components, and set arbitrary serialized component properties. |
| `ui_event` | List, add, replace, or clear serialized `EventHandler` arrays. |
| `ui_validate` | Scan UI nodes and report missing component dependencies. |

Every tool is returned by MCP `tools/list` with a JSON Schema. The same schemas are converted to OpenAI Responses, OpenAI Chat Completions, Anthropic, and Gemini formats by the existing compatibility layer.

## Cocos Creator range

The guaranteed catalog targets:

```text
>=3.8.6 <3.9.0
```

## Built-in component catalog

### Root and transform

- `cc.Canvas`
- `cc.UITransform`
- `cc.Camera`

### Layout and adaptation

- `cc.Widget`
- `cc.Layout`
- `cc.SafeArea`
- `cc.UICoordinateTracker`

### Rendering

- `cc.Sprite`
- `cc.Label`
- `cc.RichText`
- `cc.Graphics`
- `cc.Mask`
- `cc.LabelOutline`
- `cc.LabelShadow`
- `cc.UIStaticBatch`
- `cc.UIMeshRenderer`
- `cc.UIOpacity`
- `cc.UISkew`
- `cc.ParticleSystem2D`
- `cc.MotionStreak`
- `cc.TiledMap`
- `cc.TiledTile`

### Interaction

- `cc.Button`
- `cc.Toggle`
- `cc.ToggleContainer`
- `cc.Slider`
- `cc.EditBox`
- `cc.BlockInputEvents`

### Navigation and data display

- `cc.ScrollView`
- `cc.ScrollBar`
- `cc.ProgressBar`
- `cc.PageView`
- `cc.PageViewIndicator`

### Media

- `cc.WebView`
- `cc.VideoPlayer`

### Optional engine modules

- `sp.Skeleton`
- `dragonBones.ArmatureDisplay`

Project-defined component classes are also accepted by `ui_element` and `ui_query`; they do not need to be hard-coded in the catalog.

## Generic property coverage

`ui_element` does not restrict models to a small hand-written property list. It queries Cocos' serialized component dump and writes the requested property while preserving the dump's type metadata. This covers scalar values, vectors, sizes, colors, enums, arrays, node references, component references, and asset references.

Reference syntax:

```json
{ "$node": "node-uuid" }
```

```json
{
  "$component": {
    "nodeUuid": "node-uuid",
    "type": "cc.Camera"
  }
}
```

```json
{ "$asset": "asset-uuid" }
```

Use `ui_query` with `action: "component_schema"` before writing unfamiliar properties. The result reflects the actual installed Cocos patch and project component rather than a guessed schema.

## Event coverage

The catalog declares standard event arrays including:

- `Button.clickEvents`
- `Toggle.checkEvents`
- `Slider.slideEvents`
- `ScrollView.scrollEvents`
- `EditBox.editingDidBegan`
- `EditBox.textChanged`
- `EditBox.editingDidEnded`
- `EditBox.editingReturn`
- `PageView.pageEvents`
- `WebView.webviewEvents`
- `VideoPlayer.videoPlayerEvent`

`ui_event` creates actual Cocos `EventHandler` objects in the scene process. Each handler contains a target node, script component name, method name, and optional custom event data.

## Coverage gates

The regression suite fails when:

- Any documented core Cocos 3.8 UI class is absent from the catalog.
- Any of the five UI MCP tools is missing from the registry.
- A UI tool lacks an input JSON Schema.
- Catalog IDs are duplicated.
- Standard Button or EditBox event fields disappear.
- Scene-side event methods are not registered.

## Editor interface boundary

The plugin currently controls documented editor capabilities such as scenes, hierarchy, assets, Inspector-serialized properties, scene view, preferences, project settings, build, and extension panels. It cannot guarantee direct automation of every visible editor button because many controls have no public message or extension API and may change between patch releases.

When a new editor operation is needed, add it only when one of these exists:

- A documented `Editor.Message` API.
- A documented extension panel/menu API.
- A scene script operation using public engine APIs.
- A stable asset database, project setting, preference, or build API.

Private DOM selectors, mouse coordinates, and Electron internals are intentionally excluded because they cannot meet a reliable MCP contract.
