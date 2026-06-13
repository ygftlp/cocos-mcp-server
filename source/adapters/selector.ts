import { CocosAdapter, ParsedCocosVersion, parseCocosVersion } from './contracts';
import { Creator38xAdapter } from './creator-38x';
import { Creator39xAdapter } from './creator-39x';
import { UnsupportedCocosAdapter } from './unsupported';

export function detectCocosCreatorVersion(): string {
    const editor = Editor as any;
    const candidates = [
        editor?.versions?.creator,
        editor?.versions?.cocos,
        editor?.versions?.editor,
        editor?.version
    ];
    const detected = candidates.find((value) => typeof value === 'string' && value.trim());
    return detected || 'unknown';
}

export function selectCocosAdapter(rawVersion: unknown = detectCocosCreatorVersion()): CocosAdapter {
    const version = parseCocosVersion(rawVersion);
    if (Creator38xAdapter.supports(version)) return new Creator38xAdapter(version);
    if (Creator39xAdapter.supports(version)) return new Creator39xAdapter(version);

    if (version.major === 3 && version.minor === 8) {
        return new UnsupportedCocosAdapter(version, 'Cocos Creator 3.8 requires patch 3.8.6 or newer.');
    }
    return new UnsupportedCocosAdapter(version);
}

export function describeVersion(version: ParsedCocosVersion): string {
    return version.normalized || version.raw;
}
