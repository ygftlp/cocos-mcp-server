import { AssetAdapter } from './contracts/asset-adapter';
import { BuildAdapter } from './contracts/build-adapter';
import { ComponentAdapter } from './contracts/component-adapter';
import { NodeAdapter } from './contracts/node-adapter';
import { ProjectAdapter } from './contracts/project-adapter';
import { SceneAdapter } from './contracts/scene-adapter';
import { UIAdapter } from './contracts/ui-adapter';
import { CocosAdapter, CocosCompatibilityProfile } from './contracts';
import {
    UnavailableAssetAdapter,
    UnavailableBuildAdapter,
    UnavailableComponentAdapter,
    UnavailableNodeAdapter,
    UnavailableProjectAdapter,
    UnavailableSceneAdapter,
    UnavailableUIAdapter
} from './unavailable-domains';

export abstract class BaseCocosAdapter implements CocosAdapter {
    public readonly node: NodeAdapter;
    public readonly scene: SceneAdapter;
    public readonly component: ComponentAdapter;
    public readonly ui: UIAdapter;
    public readonly asset: AssetAdapter;
    public readonly build: BuildAdapter;
    public readonly project: ProjectAdapter;

    constructor(
        public readonly profile: CocosCompatibilityProfile,
        domains: {
            node?: NodeAdapter;
            scene?: SceneAdapter;
            component?: ComponentAdapter;
            ui?: UIAdapter;
            asset?: AssetAdapter;
            build?: BuildAdapter;
            project?: ProjectAdapter;
        } = {}
    ) {
        this.node = domains.node || new UnavailableNodeAdapter();
        this.scene = domains.scene || new UnavailableSceneAdapter();
        this.component = domains.component || new UnavailableComponentAdapter();
        this.ui = domains.ui || new UnavailableUIAdapter();
        this.asset = domains.asset || new UnavailableAssetAdapter();
        this.build = domains.build || new UnavailableBuildAdapter();
        this.project = domains.project || new UnavailableProjectAdapter();
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
