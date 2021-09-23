interface Option {
    [name: string]: string | null;
}
export interface Dependency {
    name: string;
    version: string;
    options: Option;
    repository?: string;
    remote?: string;
    dependencies?: Dependency[];
}
export interface Group {
    name: string;
    repositories: {
        [name: string]: string[];
    };
    dependencies: Dependency[];
    options: Option;
    specs: boolean;
}
export interface PaketLock {
    groups: Group[];
}
export declare function parseLockFile(input: string): PaketLock;
export {};
