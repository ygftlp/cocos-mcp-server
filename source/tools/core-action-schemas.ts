export type JsonSchema = Record<string, any>;

const object = (properties: Record<string, JsonSchema> = {}, required: string[] = [], additionalProperties = false): JsonSchema => ({
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties
});
const text = (description: string, extra: JsonSchema = {}): JsonSchema => ({ type: 'string', description, ...extra });
const flag = (description: string): JsonSchema => ({ type: 'boolean', description });
const number = (description: string): JsonSchema => ({ type: 'number', description });
const integer = (description: string): JsonSchema => ({ type: 'integer', description });
const strings = (description: string): JsonSchema => ({ type: 'array', items: { type: 'string' }, description });
const vec3 = (description: string): JsonSchema => object({ x: number(`${description} X`), y: number(`${description} Y`), z: number(`${description} Z`) });

const empty = object();
const uuid = object({ uuid: text('Node or asset UUID') }, ['uuid']);
const nodeUuid = object({ nodeUuid: text('Node UUID') }, ['nodeUuid']);
const prefabPath = object({ prefabPath: text('Prefab db:// URL') }, ['prefabPath']);
const assetUrl = object({ url: text('Asset db:// URL') }, ['url']);
const reflectedProperties = object({}, [], true);
const touchPoint = object({
    x: number('Touch X coordinate'),
    y: number('Touch Y coordinate'),
    radiusX: number('Touch radius X'),
    radiusY: number('Touch radius Y'),
    force: number('Touch force'),
    id: integer('Touch point ID')
}, ['x', 'y']);

export const METHOD_PARAM_SCHEMAS: Record<string, JsonSchema> = {
    get_current_scene: empty,
    get_scene_list: empty,
    open_scene: object({ scenePath: text('Scene db:// URL') }, ['scenePath']),
    save_scene: empty,
    create_scene: object({ sceneName: text('Scene name'), savePath: text('Target db:// folder or scene URL') }, ['sceneName', 'savePath']),
    close_scene: empty,
    get_scene_hierarchy: object({ includeComponents: flag('Include component summaries') }),
    query_scene_ready: empty,
    query_scene_dirty: empty,
    query_scene_classes: object({ extends: text('Optional base class') }),
    query_scene_components: empty,
    scene_snapshot_abort: empty,
    end_undo_recording: object({ undoId: text('Undo recording ID') }, ['undoId']),
    cancel_undo_recording: object({ undoId: text('Undo recording ID') }, ['undoId']),
    soft_reload_scene: empty,

    get_node_info: uuid,
    find_nodes: object({ pattern: text('Node name pattern'), exactMatch: flag('Require exact match') }, ['pattern']),
    find_node_by_name: object({ name: text('Exact node name') }, ['name']),
    get_all_nodes: empty,
    detect_node_type: uuid,
    create_node: object({
        name: text('Node name'), parentUuid: text('Optional parent UUID'), assetUuid: text('Optional prefab/asset UUID'),
        assetPath: text('Optional db:// asset URL'), unlinkPrefab: flag('Unlink prefab instance'),
        components: strings('Component class names'), nodeType: text('Optional component class'),
        keepWorldTransform: flag('Preserve world transform')
    }),
    delete_node: uuid,
    duplicate_node: uuid,
    move_node: object({ nodeUuid: text('Node UUID'), newParentUuid: text('New parent UUID') }, ['nodeUuid', 'newParentUuid']),
    set_node_transform: object({ uuid: text('Node UUID'), position: vec3('Position'), rotation: vec3('Rotation'), scale: vec3('Scale') }, ['uuid']),
    set_node_property: object({ uuid: text('Node UUID'), property: text('Property path'), value: {} }, ['uuid', 'property', 'value']),
    query_nodes_by_asset_uuid: object({ assetUuid: text('Asset UUID') }, ['assetUuid']),
    copy_node: object({ uuids: strings('Node UUIDs') }, ['uuids']),
    cut_node: object({ uuids: strings('Node UUIDs') }, ['uuids']),
    paste_node: object({ target: text('Target parent UUID'), uuids: strings('Optional node UUIDs'), keepWorldTransform: flag('Preserve world transform') }, ['target']),
    reset_node_property: object({ uuid: text('Node UUID'), path: text('Property path') }, ['uuid', 'path']),
    reset_node_transform: uuid,

    add_component: object({ nodeUuid: text('Node UUID'), componentType: text('Cocos component class name') }, ['nodeUuid', 'componentType']),
    remove_component: object({ nodeUuid: text('Node UUID'), componentType: text('Cocos component class name') }, ['nodeUuid', 'componentType']),
    get_available_components: object({ category: text('Component category') }),
    attach_script: object({ nodeUuid: text('Node UUID'), scriptPath: text('Project script path') }, ['nodeUuid', 'scriptPath']),
    query_component_has_script: object({ className: text('Component class name') }, ['className']),
    get_components: nodeUuid,
    get_component_info: object({ nodeUuid: text('Node UUID'), componentType: text('Component class name') }, ['nodeUuid', 'componentType']),
    set_component_property: object({
        nodeUuid: text('Node UUID'), componentType: text('Component class name'), property: text('Property name'),
        propertyType: text('Serialization type'), value: {}
    }, ['nodeUuid', 'componentType', 'property', 'value']),
    reset_component: object({ uuid: text('Component UUID') }, ['uuid']),
    list_component_classes: object({
        filter: text('Optional class-name filter'),
        maxResults: integer('Maximum returned classes'),
        includeBuiltin: flag('Include engine components'),
        includeProject: flag('Include project-defined components'),
        includeScriptStatus: flag('Query script status for up to 100 results')
    }),
    get_component_schema: object({
        nodeUuid: text('Node UUID containing the component'),
        componentType: text('Component class name'),
        includeHidden: flag('Include hidden serialized properties'),
        includeValues: flag('Include current serialized values'),
        maxDepth: integer('Maximum nested schema depth')
    }, ['nodeUuid', 'componentType']),
    validate_component_properties: object({
        nodeUuid: text('Node UUID containing the component'),
        componentType: text('Component class name'),
        properties: reflectedProperties,
        allowUnknown: flag('Allow property paths absent from the live serialized dump')
    }, ['nodeUuid', 'componentType', 'properties']),
    set_component_properties: object({
        nodeUuid: text('Node UUID containing the component'),
        componentType: text('Component class name'),
        properties: reflectedProperties,
        allowUnknown: flag('Allow property paths absent from the live serialized dump'),
        dryRun: flag('Validate and return planned dumps without writing')
    }, ['nodeUuid', 'componentType', 'properties']),

    get_prefab_list: object({ folder: text('Search folder', { default: 'db://assets' }) }),
    get_prefab_info: prefabPath,
    validate_prefab: prefabPath,
    load_prefab: prefabPath,
    update_prefab: object({ prefabPath: text('Prefab db:// URL'), nodeUuid: text('Instance node UUID') }, ['prefabPath', 'nodeUuid']),
    duplicate_prefab: object({ sourcePath: text('Source prefab URL'), targetPath: text('Destination prefab URL'), overwrite: flag('Overwrite target') }, ['sourcePath', 'targetPath']),
    instantiate_prefab: object({ prefabPath: text('Prefab db:// URL'), parentUuid: text('Optional parent UUID'), name: text('Optional instance name'), position: vec3('Position') }, ['prefabPath']),
    revert_prefab: nodeUuid,
    restore_prefab_node: object({ nodeUuid: text('Node UUID'), assetUuid: text('Prefab asset UUID') }, ['nodeUuid', 'assetUuid']),

    import_asset: object({ sourcePath: text('Absolute source path'), targetFolder: text('Target db:// folder') }, ['sourcePath', 'targetFolder']),
    create_asset: object({ url: text('Target db:// URL'), content: {}, overwrite: flag('Overwrite target') }, ['url']),
    delete_asset: assetUrl,
    save_asset: object({ url: text('Asset db:// URL'), content: text('Complete text content') }, ['url', 'content']),
    copy_asset: object({ source: text('Source URL'), target: text('Target URL'), overwrite: flag('Overwrite target') }, ['source', 'target']),
    move_asset: object({ source: text('Source URL'), target: text('Target URL'), overwrite: flag('Overwrite target') }, ['source', 'target']),
    reimport_asset: assetUrl,
    refresh_assets: object({ folder: text('Folder db:// URL') }),
    get_assets: object({ type: text('Asset type'), folder: text('Search folder') }),
    get_asset_info: object({ assetPath: text('Asset db:// URL') }, ['assetPath']),
    get_asset_details: object({ assetPath: text('Asset db:// URL'), includeSubAssets: flag('Include sub-assets') }, ['assetPath']),
    find_asset_by_name: object({ name: text('Asset base name'), folder: text('Search folder') }, ['name']),
    query_asset_uuid: assetUrl,
    query_asset_url: object({ uuid: text('Asset UUID') }, ['uuid']),
    query_asset_path: assetUrl,
    batch_import_assets: object({ sourceDirectory: text('Absolute source directory'), targetDirectory: text('Target db:// directory'), fileFilter: strings('File suffixes'), recursive: flag('Include subdirectories'), overwrite: flag('Overwrite assets') }, ['sourceDirectory', 'targetDirectory']),
    batch_delete_assets: object({ urls: strings('Asset db:// URLs') }, ['urls']),
    open_asset_external: object({ urlOrUUID: text('Asset URL or UUID') }, ['urlOrUUID']),
    validate_asset_references: object({ directory: text('Asset directory') }),
    export_asset_manifest: object({ directory: text('Asset directory'), format: text('Format', { enum: ['json', 'csv', 'xml'] }), includeMetadata: flag('Include metadata') }),
    generate_available_url: assetUrl,
    save_asset_meta: object({ urlOrUUID: text('Asset URL or UUID'), content: text('Metadata JSON') }, ['urlOrUUID', 'content']),

    get_project_info: empty,
    get_project_settings: object({ category: text('Settings category', { enum: ['general', 'physics', 'render', 'assets'] }) }),
    get_build_settings: empty,
    open_build_panel: empty,
    check_builder_status: empty,

    runtime_start: object({
        buildPath: text('Absolute path or project-relative Cocos web build directory'),
        browserPath: text('Optional Chrome, Edge, or Chromium executable path'),
        headless: flag('Run browser without a visible window'),
        width: integer('Browser viewport width'),
        height: integer('Browser viewport height'),
        host: text('Loopback host', { enum: ['127.0.0.1', 'localhost', '::1'] }),
        port: integer('Optional local static-server port'),
        startupTimeoutMs: integer('Startup timeout in milliseconds'),
        extraBrowserArgs: strings('Additional safe Chromium command-line arguments')
    }),
    runtime_stop: empty,
    runtime_status: empty,
    runtime_reload: object({ ignoreCache: flag('Ignore browser cache') }),
    runtime_evaluate: object({
        expression: text('JavaScript expression evaluated in the game page'),
        awaitPromise: flag('Await returned promises')
    }, ['expression']),
    runtime_wait_for: object({
        expression: text('JavaScript expression that must become truthy'),
        timeoutMs: integer('Maximum wait time'),
        intervalMs: integer('Polling interval')
    }, ['expression']),
    runtime_screenshot: object({
        format: text('Image format', { enum: ['png', 'jpeg', 'webp'] }),
        quality: integer('JPEG or WebP quality from 1 to 100'),
        filePath: text('Path relative to .cocos-mcp/runtime-artifacts'),
        fullPage: flag('Capture the full page'),
        returnBase64: flag('Include base64 image bytes in the MCP result')
    }),
    runtime_logs: object({
        sinceSequence: integer('Return entries after this sequence number'),
        clear: flag('Clear buffered logs after reading'),
        levels: { type: 'array', items: { type: 'string', enum: ['debug', 'info', 'warning', 'error'] } },
        source: text('Optional source substring filter'),
        limit: integer('Maximum returned entries')
    }),
    runtime_mouse: object({
        type: text('Mouse event type', { enum: ['move', 'down', 'up', 'click', 'wheel'] }),
        x: number('Viewport X coordinate'),
        y: number('Viewport Y coordinate'),
        button: text('Mouse button', { enum: ['none', 'left', 'middle', 'right'] }),
        clickCount: integer('Click count'),
        deltaX: number('Horizontal wheel delta'),
        deltaY: number('Vertical wheel delta')
    }, ['type', 'x', 'y']),
    runtime_keyboard: object({
        type: text('Keyboard event type', { enum: ['keyDown', 'keyUp', 'char', 'press'] }),
        key: text('Keyboard key value'),
        code: text('Keyboard physical code'),
        text: text('Optional generated text'),
        modifiers: integer('CDP modifier bitmask')
    }, ['type', 'key']),
    runtime_touch: object({
        type: text('Touch event type', { enum: ['touchStart', 'touchMove', 'touchEnd', 'tap'] }),
        points: { type: 'array', items: touchPoint }
    }, ['type', 'points']),

    get_project_logs: object({ lines: integer('Trailing line count'), filterKeyword: text('Substring filter'), logLevel: text('Log level') }),
    get_log_file_info: empty,
    search_project_logs: object({ pattern: text('Literal or regular expression'), maxResults: integer('Maximum results'), contextLines: integer('Context lines') }, ['pattern']),
    get_editor_info: empty,
    get_performance_stats: empty,
    get_node_tree: object({ rootUuid: text('Optional root UUID'), maxDepth: integer('Maximum depth') }),
    validate_scene: object({ checkMissingAssets: flag('Check missing assets'), checkPerformance: flag('Check performance') }),

    query_server_ip_list: empty,
    query_sorted_server_ip_list: empty,
    query_server_port: empty,
    get_server_status: empty,
    check_server_connectivity: object({ timeout: integer('Timeout milliseconds') }),
    get_network_interfaces: empty,
    batch_call: object({
        calls: { type: 'array', minItems: 1, maxItems: 20, items: object({ name: text('Fully-qualified tool name'), arguments: object({}, [], true) }, ['name']) },
        stopOnError: flag('Stop after first failed call')
    }, ['calls']),
    invalidate_cache: object({ scope: text('Cache scope', { enum: ['all', 'scene', 'nodes', 'assets', 'project'] }) }),

    add_reference_image: object({ paths: strings('Absolute image paths') }, ['paths']),
    remove_reference_image: object({ paths: strings('Image paths') }),
    switch_reference_image: object({ path: text('Image path'), sceneUUID: text('Optional scene UUID') }, ['path']),
    set_reference_image_data: object({ key: text('Setting key'), value: {} }, ['key', 'value']),
    set_reference_image_position: object({ x: number('X'), y: number('Y') }, ['x', 'y']),
    set_reference_image_scale: object({ sx: number('X scale'), sy: number('Y scale') }, ['sx', 'sy']),
    set_reference_image_opacity: object({ opacity: number('Opacity') }, ['opacity']),

    change_gizmo_tool: object({ name: text('Gizmo tool') }, ['name']),
    change_gizmo_pivot: object({ name: text('Pivot mode') }, ['name']),
    change_gizmo_coordinate: object({ type: text('Coordinate mode') }, ['type']),
    change_view_mode_2d_3d: object({ is2D: flag('Use 2D view') }, ['is2D']),
    set_grid_visible: object({ visible: flag('Grid visibility') }, ['visible']),
    set_icon_gizmo_3d: object({ is3D: flag('Use 3D icons') }, ['is3D']),
    set_icon_gizmo_size: object({ size: number('Icon size') }, ['size']),
    focus_camera_on_nodes: object({ uuids: strings('Node UUIDs') }),

    validate_json_params: object({ jsonString: text('JSON text'), expectedSchema: object({}, [], true) }, ['jsonString']),
    safe_string_value: object({ value: text('String to escape') }, ['value']),
    format_mcp_request: object({ toolName: text('Fully-qualified tool name'), arguments: object({}, [], true) }, ['toolName', 'arguments'])
};

export function schemaForMethod(method: string): JsonSchema {
    return METHOD_PARAM_SCHEMAS[method] || { type: 'object', description: `Parameters for ${method}`, additionalProperties: true };
}
