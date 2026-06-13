export interface ProjectDescriptor {
    name: string;
    path: string;
    uuid: string;
    version: string;
    cocosVersion: string;
}

export interface ProjectAdapter {
    describe(): ProjectDescriptor;
    queryConfig(name: string): Promise<any>;
}
