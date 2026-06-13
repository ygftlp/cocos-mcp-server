// Cocos Editor message protocols are extensible and several runtime payloads
// expose fields not present in every published 3.8 type package. Keep the
// transport dynamic at this boundary and normalize responses in tool adapters.
declare namespace Editor.Message {
    function request(packageName: string, messageName: string, ...args: any[]): Promise<any>;
}
