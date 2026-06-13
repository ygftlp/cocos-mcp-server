export type UIComponentCategory = 'root' | 'transform' | 'render' | 'layout' | 'interactive' | 'navigation' | 'media' | 'utility' | 'optional';

export interface UIComponentDescriptor {
    id: string;
    className: string;
    displayName: string;
    category: UIComponentCategory;
    aliases: string[];
    dependencies: string[];
    eventProperties: string[];
    optionalModule?: string;
}

const component = (
    id: string,
    className: string,
    displayName: string,
    category: UIComponentCategory,
    dependencies: string[] = ['cc.UITransform'],
    eventProperties: string[] = [],
    optionalModule?: string
): UIComponentDescriptor => ({
    id,
    className,
    displayName,
    category,
    aliases: Array.from(new Set([id, className, className.replace(/^cc\./, ''), displayName])).map((value) => value.toLowerCase()),
    dependencies,
    eventProperties,
    optionalModule
});

/**
 * Cocos Creator 3.8 UI and 2D-renderable component coverage catalog.
 * Generic tools also accept custom component class names, so project-defined UI
 * components and future 3.8 patch components remain addressable.
 */
export const UI_COMPONENT_CATALOG: UIComponentDescriptor[] = [
    component('canvas', 'cc.Canvas', 'Canvas', 'root', ['cc.UITransform']),
    component('ui-transform', 'cc.UITransform', 'UITransform', 'transform', []),
    component('widget', 'cc.Widget', 'Widget', 'layout'),
    component('layout', 'cc.Layout', 'Layout', 'layout'),
    component('safe-area', 'cc.SafeArea', 'SafeArea', 'layout'),
    component('ui-coordinate-tracker', 'cc.UICoordinateTracker', 'UICoordinateTracker', 'layout'),

    component('sprite', 'cc.Sprite', 'Sprite', 'render'),
    component('label', 'cc.Label', 'Label', 'render'),
    component('rich-text', 'cc.RichText', 'RichText', 'render'),
    component('graphics', 'cc.Graphics', 'Graphics', 'render'),
    component('mask', 'cc.Mask', 'Mask', 'render'),
    component('label-outline', 'cc.LabelOutline', 'LabelOutline', 'render', ['cc.UITransform', 'cc.Label']),
    component('label-shadow', 'cc.LabelShadow', 'LabelShadow', 'render', ['cc.UITransform', 'cc.Label']),
    component('ui-static-batch', 'cc.UIStaticBatch', 'UIStaticBatch', 'render'),
    component('ui-mesh-renderer', 'cc.UIMeshRenderer', 'UIMeshRenderer', 'render'),
    component('ui-opacity', 'cc.UIOpacity', 'UIOpacity', 'render'),
    component('ui-skew', 'cc.UISkew', 'UISkew', 'render'),
    component('particle-system-2d', 'cc.ParticleSystem2D', 'ParticleSystem2D', 'render'),
    component('motion-streak', 'cc.MotionStreak', 'MotionStreak', 'render'),
    component('tiled-map', 'cc.TiledMap', 'TiledMap', 'render'),
    component('tiled-tile', 'cc.TiledTile', 'TiledTile', 'render'),

    component('button', 'cc.Button', 'Button', 'interactive', ['cc.UITransform'], ['clickEvents']),
    component('toggle', 'cc.Toggle', 'Toggle', 'interactive', ['cc.UITransform'], ['checkEvents']),
    component('toggle-container', 'cc.ToggleContainer', 'ToggleContainer', 'interactive', ['cc.UITransform']),
    component('slider', 'cc.Slider', 'Slider', 'interactive', ['cc.UITransform'], ['slideEvents']),
    component('edit-box', 'cc.EditBox', 'EditBox', 'interactive', ['cc.UITransform'], ['editingDidBegan', 'textChanged', 'editingDidEnded', 'editingReturn']),
    component('block-input-events', 'cc.BlockInputEvents', 'BlockInputEvents', 'interactive'),

    component('scroll-view', 'cc.ScrollView', 'ScrollView', 'navigation', ['cc.UITransform'], ['scrollEvents']),
    component('scroll-bar', 'cc.ScrollBar', 'ScrollBar', 'navigation'),
    component('progress-bar', 'cc.ProgressBar', 'ProgressBar', 'navigation'),
    component('page-view', 'cc.PageView', 'PageView', 'navigation', ['cc.UITransform'], ['pageEvents']),
    component('page-view-indicator', 'cc.PageViewIndicator', 'PageViewIndicator', 'navigation'),

    component('web-view', 'cc.WebView', 'WebView', 'media', ['cc.UITransform'], ['webviewEvents']),
    component('video-player', 'cc.VideoPlayer', 'VideoPlayer', 'media', ['cc.UITransform'], ['videoPlayerEvent']),

    component('camera', 'cc.Camera', 'Camera', 'utility', []),
    component('spine-skeleton', 'sp.Skeleton', 'Spine Skeleton', 'optional', ['cc.UITransform'], [], 'spine'),
    component('dragonbones-armature', 'dragonBones.ArmatureDisplay', 'DragonBones ArmatureDisplay', 'optional', ['cc.UITransform'], [], 'dragonBones')
];

const byAlias = new Map<string, UIComponentDescriptor>();
for (const descriptor of UI_COMPONENT_CATALOG) {
    for (const alias of descriptor.aliases) byAlias.set(alias, descriptor);
}

export function findUIComponent(value: string): UIComponentDescriptor | null {
    const normalized = String(value || '').trim().toLowerCase();
    return byAlias.get(normalized) || null;
}

export function normalizeUIComponentClass(value: string): string {
    const descriptor = findUIComponent(value);
    if (descriptor) return descriptor.className;
    const custom = String(value || '').trim();
    if (!/^[A-Za-z_$][A-Za-z0-9_$.]*$/.test(custom)) throw new Error(`Invalid component class name: ${value}`);
    return custom;
}

export function isCatalogUIComponent(value: string): boolean {
    return Boolean(findUIComponent(value));
}
