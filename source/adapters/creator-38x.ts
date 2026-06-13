import { BaseCocosAdapter } from './base-adapter';
import { createStable38xCapabilities } from './capabilities';
import { ParsedCocosVersion } from './contracts';
import { Creator38xComponentAdapter } from './creator-38x/component-adapter';
import { Creator38xNodeAdapter } from './creator-38x/node-adapter';
import { Creator38xSceneAdapter } from './creator-38x/scene-adapter';
import { Creator38xUIAdapter } from './creator-38x/ui-adapter';

export class Creator38xAdapter extends BaseCocosAdapter {
    static supports(version: ParsedCocosVersion): boolean {
        return version.major === 3 && version.minor === 8 && (version.patch || 0) >= 6;
    }

    constructor(version: ParsedCocosVersion) {
        super({
            adapterId: 'creator-38x',
            creatorVersion: version.raw,
            normalizedVersion: version.normalized,
            versionRange: '>=3.8.6 <3.9.0',
            supportLevel: 'stable',
            writeEnabled: true,
            capabilities: createStable38xCapabilities(),
            warnings: []
        }, {
            node: new Creator38xNodeAdapter(),
            scene: new Creator38xSceneAdapter(),
            component: new Creator38xComponentAdapter(),
            ui: new Creator38xUIAdapter()
        });
    }
}
