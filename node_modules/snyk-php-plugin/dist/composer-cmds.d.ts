export declare const composerCmd = "composer --version";
export declare const composerShowCmd = "composer show -p";
export declare const pharCmd: string;
export declare function cmdReturnsOk(cmd: any): boolean;
export declare function execWithResult(cmd: any, basePath: any): string;
