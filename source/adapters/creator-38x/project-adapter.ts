import { ProjectAdapter, ProjectDescriptor } from '../contracts/project-adapter';

export class Creator38xProjectAdapter implements ProjectAdapter {
    describe(): ProjectDescriptor {
        return {
            name: Editor.Project.name,
            path: Editor.Project.path,
            uuid: Editor.Project.uuid,
            version: (Editor.Project as any).version || '1.0.0',
            cocosVersion: (Editor as any).versions?.creator || (Editor as any).versions?.cocos || 'Unknown'
        };
    }

    queryConfig(name: string): Promise<any> {
        return (Editor.Message.request as any)('project', 'query-config', name);
    }
}
