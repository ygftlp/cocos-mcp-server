# Complete game creation through MCP

The `project_create_game` tool closes the gap between source scaffolding and a playable Cocos Creator scene.

## Supported editor range

The repository currently targets Cocos Creator `>=3.8.6 <3.9.0`.

## Built-in playable template

```json
{
  "template": "arcade-clicker-2d",
  "projectName": "Target Rush",
  "root": "assets/game",
  "sceneName": "Main",
  "sceneFolder": "scenes",
  "overwrite": false,
  "dryRun": false,
  "scriptWaitMs": 30000
}
```

The generated project contains:

- An asset-free `ArcadeClicker` component.
- A score counter and 30-second timer.
- A moving touch target.
- A finished state and restart control.
- A generated Canvas and UI Camera scene hierarchy.
- A build handoff containing the generated scene URL.

Use `dryRun: true` before writing files. The dry run returns the planned files, nodes, target scene, and template without modifying the project.

## Custom blueprints

A model can construct a custom game by supplying files and a parent-first node list:

```json
{
  "template": "custom",
  "projectName": "My Game",
  "root": "assets/game",
  "sceneName": "Main",
  "blueprint": {
    "entryComponent": "GameEntry",
    "files": [
      {
        "path": "scripts/GameEntry.ts",
        "content": "import { _decorator, Component } from 'cc';\nconst { ccclass } = _decorator;\n@ccclass('GameEntry') export class GameEntry extends Component {}\n"
      }
    ],
    "nodes": [
      {
        "id": "canvas",
        "name": "GameCanvas",
        "components": [
          {
            "type": "cc.Canvas",
            "properties": {
              "cameraComponent": {
                "$component": { "node": "camera", "type": "cc.Camera" }
              }
            }
          },
          {
            "type": "cc.UITransform",
            "properties": {
              "contentSize": { "width": 960, "height": 640 }
            }
          },
          { "type": "GameEntry" }
        ]
      },
      {
        "id": "camera",
        "name": "UICamera",
        "parentId": "canvas",
        "position": { "z": 1000 },
        "components": [
          {
            "type": "cc.Camera",
            "properties": {
              "projection": 0,
              "orthoHeight": 320,
              "visibility": 33554432
            }
          }
        ]
      }
    ]
  }
}
```

References supported in component properties:

- `{ "$node": "node-id" }` resolves to a generated node UUID.
- `{ "$component": { "node": "node-id", "type": "cc.Camera" } }` resolves to a generated component UUID.

## Execution phases

1. Validate project-relative paths and blueprint limits.
2. Write generated files below `assets/`.
3. Refresh the Asset Database.
4. Create and open the target scene.
5. Create all nodes in parent-first order.
6. Wait for generated scripts to compile and attach every component.
7. Resolve node/component references and apply component properties.
8. Save the scene and verify both the scene asset and hierarchy.
9. Return a `project_build` handoff using the generated scene URL.

## Safety limits

- At most 100 generated files.
- At most 500 generated nodes.
- At most 5 MB total generated file content.
- All file writes must remain under the selected `assets/` root.
- Parent nodes must be declared before their children.
- Script compilation waits are bounded to 1–120 seconds.

## Build

After successful creation, invoke the returned build handoff or call:

```json
{
  "platform": "web-desktop",
  "mode": "auto",
  "options": {
    "scenes": ["db://assets/game/scenes/Main.scene"]
  }
}
```

## Current scope

The built-in template is a complete small playable game, not a full production game framework. Larger games are constructed through custom blueprints plus the existing scene, node, component, asset, prefab-instance, validation, and build tools. External art, audio, native SDK setup, store signing, and platform credentials must still be supplied by the project owner.
