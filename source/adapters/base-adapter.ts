import { ComponentAdapter } from './contracts/component-adapter';
import { NodeAdapter } from './contracts/node-adapter';
import { SceneAdapter } from './contracts/scene-adapter';
import { UIAdapter } from './contracts/ui-adapter';
import { CocosAdapter, CocosCompatibilityProfile } from './contracts';
import {
    UnavailableComponentAdapter,
    UnavailableNodeAdapter,
    UnavailableSceneAdapter,
    UnavailableUIAdapter
} from './unavailable-domains';

export abstract class BaseCocosAdapter implements CocosAdapter {
    public readonly node: NodeAdapter;
    public readonly scene: SceneAdapter;
    public readonly component: ComponentAdapter;
    public readonly ui: UIAdapter;

    constructor(
        public readonly profile: CocosCompatibilityProfile,
        domains: {
            node?: NodeAdapter;
            scene?: SceneAdapter;
            component?: ComponentAdapter;
            ui?: UIAdapter;
        } = {}
    ) {
        this.node = domains.node || new UnavailableNodeAdapter();
        this.scene = domains.scene || new UnavailableSceneAdapter();
        this.component = domains.component || new UnavailableComponentAdapter();
        this.ui = domains.ui || new UnavailableUIAdapter();
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
