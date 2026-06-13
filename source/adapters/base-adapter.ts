import { CocosAdapter, CocosCompatibilityProfile } from './contracts';

export abstract class BaseCocosAdapter implements CocosAdapter {
    constructor(public readonly profile: CocosCompatibilityProfile) {}

    request(channel: string, message: string, ...args: any[]): Promise<any> {
        return (Editor.Message.request as any)(channel, message, ...args);
    }

    send(channel: string, message: string, ...args: any[]): void {
        (Editor.Message.send as any)(channel, message, ...args);
    }

    openPanel(name: string): void {
        Editor.Panel.open(name);
    }
}
