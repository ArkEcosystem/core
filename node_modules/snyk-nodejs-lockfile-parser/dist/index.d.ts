import 'source-map-support/register';
import { PkgTree, Scope, LockfileType, getYarnWorkspaces } from './parsers';
import { UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError } from './errors';
export { buildDepTree, buildDepTreeFromFiles, getYarnWorkspacesFromFiles, getYarnWorkspaces, PkgTree, Scope, LockfileType, UnsupportedRuntimeError, InvalidUserInputError, OutOfSyncError, };
declare function buildDepTree(manifestFileContents: string, lockFileContents: string, includeDev?: boolean, lockfileType?: LockfileType, strict?: boolean, defaultManifestFileName?: string): Promise<PkgTree>;
declare function buildDepTreeFromFiles(root: string, manifestFilePath: string, lockFilePath: string, includeDev?: boolean, strict?: boolean): Promise<PkgTree>;
declare function getYarnWorkspacesFromFiles(root: any, manifestFilePath: string): string[] | false;
