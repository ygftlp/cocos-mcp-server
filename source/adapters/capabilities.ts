import { CocosCapabilityMap } from './contracts';

export const TOOL_CATEGORIES = [
    'scene', 'node', 'component', 'ui', 'prefab', 'asset', 'project',
    'debug', 'preferences', 'server', 'referenceImage', 'sceneView', 'validation'
] as const;

export function createStable38xCapabilities(): CocosCapabilityMap {
    const capabilities: CocosCapabilityMap = {
        'compatibility.read': true,
        'project.build': true,
        'ui.events': true
    };
    for (const category of TOOL_CATEGORIES) {
        capabilities[category + '.read'] = true;
        capabilities[category + '.write'] = true;
    }
    return capabilities;
}

export function createDiagnosticOnlyCapabilities(): CocosCapabilityMap {
    return { 'compatibility.read': true };
}
