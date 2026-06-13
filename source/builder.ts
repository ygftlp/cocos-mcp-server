export const configs: Record<string, any> = {
    '*': {
        hooks: './builder-hooks'
    }
};

export function load(): void {
    console.log('[cocos-mcp-server] Build extension loaded');
}

export function unload(): void {
    console.log('[cocos-mcp-server] Build extension unloaded');
}
