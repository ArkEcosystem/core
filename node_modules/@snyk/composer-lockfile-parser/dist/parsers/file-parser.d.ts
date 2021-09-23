import { ComposerJsonFile, ComposerLockFile } from '../types';
export declare class FileParser {
    static parseLockFile(lockFileContent: string): ComposerLockFile;
    static parseManifestFile(manifestFileContent: string): ComposerJsonFile;
}
