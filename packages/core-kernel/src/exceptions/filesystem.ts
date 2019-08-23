// tslint:disable: max-classes-per-file

import { RuntimeException } from "./runtime";

/**
 * @export
 * @class FileException
 * @extends {RuntimeException}
 */
export class FileException extends RuntimeException {}

/**
 * @export
 * @class AccessDenied
 * @extends {FileException}
 */
export class AccessDenied extends FileException {
    public constructor(path: string) {
        super(`The file ${path} could not be accessed.`);
    }
}

/**
 * @export
 * @class CannotWriteFile
 * @extends {FileException}
 */
export class CannotWriteFile extends FileException {}

/**
 * @export
 * @class DirectoryCannotBeFound
 * @extends {FileException}
 */
export class DirectoryCannotBeFound extends FileException {
    /**
     * @param {string} value
     * @memberof DirectoryCannotBeFound
     */
    constructor(value: string) {
        super(`Directory [${value}] could not be found.`);
    }
}
