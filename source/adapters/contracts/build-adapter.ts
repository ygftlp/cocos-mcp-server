export interface BuildAdapter {
    openPanel(): Promise<void>;
    queryWorkerReady(): Promise<boolean>;
    build(options: Record<string, any>): Promise<any>;
}
