import { CreateSceneRequest, SceneAdapter } from '../contracts/scene-adapter';

export class Creator38xSceneAdapter implements SceneAdapter {
    queryNodeTree(): Promise<any> {
        return (Editor.Message.request as any)('scene', 'query-node-tree');
    }

    executeSceneScript(method: string, args: any[]): Promise<any> {
        return (Editor.Message.request as any)('scene', 'execute-scene-script', {
            name: 'cocos-mcp-server',
            method,
            args
        });
    }

    querySceneAssets(): Promise<any[]> {
        return (Editor.Message.request as any)('asset-db', 'query-assets', {
            pattern: 'db://assets/**/*.scene'
        });
    }

    queryAssetUuid(scenePath: string): Promise<string | null> {
        return (Editor.Message.request as any)('asset-db', 'query-uuid', scenePath);
    }

    async openScene(uuid: string): Promise<void> {
        await (Editor.Message.request as any)('scene', 'open-scene', uuid);
    }

    async saveScene(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'save-scene');
    }

    createScene(request: CreateSceneRequest): Promise<any> {
        return (Editor.Message.request as any)(
            'asset-db',
            'create-asset',
            request.fullPath,
            this.buildSceneContent(request.sceneName)
        );
    }

    async openSaveAsDialog(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'save-as-scene');
    }

    async closeScene(): Promise<void> {
        await (Editor.Message.request as any)('scene', 'close-scene');
    }

    private buildSceneContent(sceneName: string): string {
        return JSON.stringify([
            {
                __type__: 'cc.SceneAsset',
                _name: sceneName,
                _objFlags: 0,
                __editorExtras__: {},
                _native: '',
                scene: { __id__: 1 }
            },
            {
                __type__: 'cc.Scene',
                _name: sceneName,
                _objFlags: 0,
                __editorExtras__: {},
                _parent: null,
                _children: [],
                _active: true,
                _components: [],
                _prefab: null,
                _lpos: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
                _lrot: { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 },
                _lscale: { __type__: 'cc.Vec3', x: 1, y: 1, z: 1 },
                _mobility: 0,
                _layer: 1073741824,
                _euler: { __type__: 'cc.Vec3', x: 0, y: 0, z: 0 },
                autoReleaseAssets: false,
                _globals: { __id__: 2 },
                _id: 'scene'
            },
            {
                __type__: 'cc.SceneGlobals',
                ambient: { __id__: 3 },
                skybox: { __id__: 4 },
                fog: { __id__: 5 },
                octree: { __id__: 6 }
            },
            {
                __type__: 'cc.AmbientInfo',
                _skyColorHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 0.520833 },
                _skyColor: { __type__: 'cc.Vec4', x: 0.2, y: 0.5, z: 0.8, w: 0.520833 },
                _skyIllumHDR: 20000,
                _skyIllum: 20000,
                _groundAlbedoHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
                _groundAlbedo: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 }
            },
            {
                __type__: 'cc.SkyboxInfo',
                _envLightingType: 0,
                _envmapHDR: null,
                _envmap: null,
                _envmapLodCount: 0,
                _diffuseMapHDR: null,
                _diffuseMap: null,
                _enabled: false,
                _useHDR: true,
                _editableMaterial: null,
                _reflectionHDR: null,
                _reflectionMap: null,
                _rotationAngle: 0
            },
            {
                __type__: 'cc.FogInfo',
                _type: 0,
                _fogColor: { __type__: 'cc.Color', r: 200, g: 200, b: 200, a: 255 },
                _enabled: false,
                _fogDensity: 0.3,
                _fogStart: 0.5,
                _fogEnd: 300,
                _fogAtten: 5,
                _fogTop: 1.5,
                _fogRange: 1.2,
                _accurate: false
            },
            {
                __type__: 'cc.OctreeInfo',
                _enabled: false,
                _minPos: { __type__: 'cc.Vec3', x: -1024, y: -1024, z: -1024 },
                _maxPos: { __type__: 'cc.Vec3', x: 1024, y: 1024, z: 1024 },
                _depth: 8
            }
        ], null, 2);
    }
}
