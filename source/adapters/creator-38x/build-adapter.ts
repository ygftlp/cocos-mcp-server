import { BuildAdapter } from '../contracts/build-adapter';

export class Creator38xBuildAdapter implements BuildAdapter {
    async openPanel(): Promise<void> {
        await (Editor.Message.request as any)('builder', 'open');
    }

    async queryWorkerReady(): Promise<boolean> {
        return Boolean(await (Editor.Message.request as any)('builder', 'query-worker-ready'));
    }

    build(options: Record<string, any>): Promise<any> {
        return (Editor.Message.request as any)('builder', 'build', options);
    }
}
