import { BaseCocosAdapter } from './base-adapter';
import { createStable38xCapabilities } from './capabilities';
import { ParsedCocosVersion } from './contracts';

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
        });
    }
}
