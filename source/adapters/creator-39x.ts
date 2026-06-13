import { BaseCocosAdapter } from './base-adapter';
import { createDiagnosticOnlyCapabilities } from './capabilities';
import { ParsedCocosVersion } from './contracts';

export class Creator39xAdapter extends BaseCocosAdapter {
    static supports(version: ParsedCocosVersion): boolean {
        return version.major === 3 && version.minor === 9;
    }

    constructor(version: ParsedCocosVersion) {
        super({
            adapterId: 'creator-39x',
            creatorVersion: version.raw,
            normalizedVersion: version.normalized,
            versionRange: '>=3.9.0 <3.10.0',
            supportLevel: 'preview',
            writeEnabled: false,
            capabilities: createDiagnosticOnlyCapabilities(),
            warnings: [
                'The Creator 3.9 adapter is a compatibility placeholder.',
                'Editor read/write tools remain disabled until contract and editor integration tests pass.'
            ]
        });
    }
}
