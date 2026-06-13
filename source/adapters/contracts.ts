import { AssetAdapter } from './contracts/asset-adapter';
import { BuildAdapter } from './contracts/build-adapter';
import { ComponentAdapter } from './contracts/component-adapter';
import { NodeAdapter } from './contracts/node-adapter';
import { PrefabAdapter } from './contracts/prefab-adapter';
import { ProjectAdapter } from './contracts/project-adapter';
import { SceneAdvancedAdapter } from './contracts/scene-advanced-adapter';
import { SceneAdapter } from './contracts/scene-adapter';
import { UIAdapter } from './contracts/ui-adapter';

export type CocosSupportLevel = 'stable' | 'preview' | 'unsupported';
export type CocosCapabilityMap = Record<string, boolean>;

export interface ParsedCocosVersion {
    raw: string;
    major: number | null;
    minor: number | null;
    patch: number | null;
    normalized: string | null;
}

export interface CocosCompatibilityProfile {
    adapterId: string;
    creatorVersion: string;
    normalizedVersion: string | null;
    versionRange: string;
    supportLevel: CocosSupportLevel;
    writeEnabled: boolean;
    capabilities: CocosCapabilityMap;
    warnings: string[];
}

export interface CocosAdapter {
    readonly profile: CocosCompatibilityProfile;
    readonly node: NodeAdapter;
    readonly scene: SceneAdapter;
    readonly sceneAdvanced: SceneAdvancedAdapter;
    readonly component: ComponentAdapter;
    readonly ui: UIAdapter;
    readonly asset: AssetAdapter;
    readonly prefab: PrefabAdapter;
    readonly build: BuildAdapter;
    readonly project: ProjectAdapter;

    request(channel: string, message: string, ...args: any[]): Promise<any>;
    send(channel: string, message: string, ...args: any[]): void;
    openPanel(name: string): void;
}

export interface CocosCompatibilityReport extends CocosCompatibilityProfile {
    availableToolCount: number;
    disabledToolCount: number;
    disabledTools: Array<{
        name: string;
        missingCapabilities: string[];
    }>;
}

export function parseCocosVersion(rawInput: unknown): ParsedCocosVersion {
    const raw = typeof rawInput === 'string' ? rawInput.trim() : '';
    const match = raw.match(/(?:^|[^0-9])(\d+)\.(\d+)(?:\.(\d+))?/);
    if (!match) {
        return { raw: raw || 'unknown', major: null, minor: null, patch: null, normalized: null };
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = match[3] === undefined ? 0 : Number(match[3]);
    return {
        raw,
        major,
        minor,
        patch,
        normalized: `${major}.${minor}.${patch}`
    };
}

export function capabilityEnabled(profile: CocosCompatibilityProfile, capability: string): boolean {
    return profile.capabilities[capability] === true;
}
