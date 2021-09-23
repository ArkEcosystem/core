import { LockfileParser, PkgTree, ManifestFile, Lockfile, LockfileType } from './';
export interface PackageLock {
    name: string;
    version: string;
    dependencies?: PackageLockDeps;
    lockfileVersion: number;
    type: LockfileType.npm;
}
export interface PackageLockDeps {
    [depName: string]: PackageLockDep;
}
export interface PackageLockDep {
    version: string;
    requires?: {
        [depName: string]: string;
    };
    dependencies?: PackageLockDeps;
    dev?: boolean;
}
export declare class PackageLockParser implements LockfileParser {
    private pathDelimiter;
    parseLockFile(lockFileContents: string): PackageLock;
    getDependencyTree(manifestFile: ManifestFile, lockfile: Lockfile, includeDev?: boolean, strict?: boolean): Promise<PkgTree>;
    private setDevDepRec;
    private removeCycle;
    private cloneAcyclicNodeEdges;
    private cloneNodeWithoutEdges;
    private createGraphOfDependencies;
    private findDepsPath;
    private createDepTrees;
    private flattenLockfile;
}
