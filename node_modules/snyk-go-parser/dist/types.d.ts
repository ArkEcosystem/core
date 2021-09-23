export declare type GoPackageManagerType = 'golangdep' | 'govendor' | 'gomodules';
export interface LockedDep {
    name: string;
    version: string;
}
export interface LockedDeps {
    [dep: string]: LockedDep;
}
export interface GoProjectConfig {
    ignoredPkgs?: string[];
    lockedVersions: LockedDeps;
    packageName?: string;
}
export interface GoMod {
    moduleName: string;
    golangVersion?: string;
    requires: Require[];
    replaces: Replace[];
    excludes: ModuleAndVersion[];
}
export interface ModuleExactVersion {
    exactVersion: string;
    incompatible: boolean;
}
export interface ModulePseudoVersion {
    baseVersion: string;
    suffix: string;
    hash: string;
    timestamp: string;
}
export interface ModuleAndVersion {
    moduleName: string;
    version: ModuleVersion;
}
export declare type ModuleVersion = ModuleExactVersion | ModulePseudoVersion;
export interface Require extends ModuleAndVersion {
    indirect: boolean;
}
export interface ModuleAndMaybeVersion {
    moduleName: string;
    version?: ModuleVersion;
}
export interface Replace {
    oldMod: ModuleAndMaybeVersion;
    newMod: ModuleAndMaybeVersion;
}
export interface DepTree {
    name: string;
    version: string;
    dependencies?: {
        [dep: string]: DepTree;
    };
}
