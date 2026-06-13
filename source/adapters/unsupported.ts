import { BaseCocosAdapter } from './base-adapter';
import { createDiagnosticOnlyCapabilities } from './capabilities';
import { ParsedCocosVersion } from './contracts';

export class UnsupportedCocosAdapter extends BaseCocosAdapter {
    constructor(version: ParsedCocosVersion, reason?: string) {
        super({
            adapterId: 'unsupported',
            creatorVersion: version.raw,
            normalizedVersion: version.normalized,
            versionRange: '>=3.8.6 <3.9.0',
            supportLevel: 'unsupported',
            writeEnabled: false,
            capabilities: createDiagnosticOnlyCapabilities(),
            warnings: [
                reason || `Unsupported Cocos Creator version: ${version.raw}`,
                'Only compatibility diagnostics are exposed; all editor read/write tools are disabled.'
            ]
        });
    }
}
