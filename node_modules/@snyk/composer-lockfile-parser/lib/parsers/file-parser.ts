import { ParseError } from '../errors';
import { ComposerJsonFile, ComposerLockFile } from '../types';

export class FileParser {
  public static parseLockFile(lockFileContent: string): ComposerLockFile {
    try {
      return JSON.parse(lockFileContent);
    } catch (e) {
      throw new ParseError(`Failed to parse lock file. Error: ${e.message}`);
    }
  }

  public static parseManifestFile(manifestFileContent: string): ComposerJsonFile {
    try {
      return JSON.parse(manifestFileContent);
    } catch (e) {
      throw new ParseError(`Failed to parse manifest file. Error: ${e.message}`);
    }
  }
}
