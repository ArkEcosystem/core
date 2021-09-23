export interface PkgTree {
    name: string;
    version: string;
    dependencies: {
        [dep: string]: PkgTree;
    };
    targetFrameworks?: string[];
}
export interface ProjectAssetsJsonManifest {
    targets: {
        [target: string]: {
            [name: string]: {
                type: string;
                dependencies?: {
                    [deps: string]: string;
                };
            };
        };
    };
    project: {
        restore: {
            projectName: string;
        };
        version: string;
    };
}
export declare function getDependencyTreeFromProjectAssetsJson(manifestFile: ProjectAssetsJsonManifest, targetFrameWork: any): PkgTree;
