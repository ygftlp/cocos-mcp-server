import { NodeAdapter } from './contracts/node-adapter';
import { SceneAdapter } from './contracts/scene-adapter';
import { CocosAdapter, CocosCompatibilityProfile } from './contracts';
import { UnavailableNodeAdapter, UnavailableSceneAdapter } from './unavailable-domains';

export abstract class BaseCocosAdapter implements CocosAdapter {
    public readonly node: NodeAdapter;
    public readonly scene: SceneAdapter;

    constructor(
        public readonly profile: CocosCompatibilityProfile,
        domains: { node?: NodeAdapter; scene?: SceneAdapter } = {}
    ) {
        this.node = domains.node || new UnavailableNodeAdapter();
        this.scene = domains.scene || new UnavailableSceneAdapter();
    }

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
