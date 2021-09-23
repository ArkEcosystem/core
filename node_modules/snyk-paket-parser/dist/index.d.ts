import { InvalidUserInputError, OutOfSyncError } from './errors';
export { InvalidUserInputError, OutOfSyncError };
export interface DepTree {
    name: string;
    version: string;
    dependencies: {
        [dep: string]: DepTree;
    };
    depType?: DepType;
    hasDevDependencies?: boolean;
    targetFrameworks?: string[];
    missingLockFileEntry?: boolean;
}
export declare enum DepType {
    prod = "prod",
    dev = "dev"
}
export declare function buildDepTreeFromFiles(root: string, manifestFilePath: string, lockFilePath: string, includeDev?: boolean, strict?: boolean): Promise<DepTree>;
