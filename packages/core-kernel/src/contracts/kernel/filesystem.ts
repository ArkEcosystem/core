/**
 * @export
 * @interface Filesystem
 */
export interface Filesystem {
    /**
     * Create a new instance of the filesystem.
     *
     * @returns {Promise<Filesystem>}
     * @memberof Filesystem
     */
    make(): Promise<Filesystem>;

    /**
     * Determine if a file exists.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    exists(path: string): Promise<boolean>;

    /**
     * Get the contents of a file.
     *
     * @param {string} path
     * @returns {Promise<Buffer>}
     * @memberof Filesystem
     */
    get(path: string): Promise<Buffer>;

    /**
     * Write the contents of a file.
     *
     * @param {string} path
     * @param {string} contents
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    put(path: string, contents: string): Promise<boolean>;

    /**
     * Delete the file at a given path.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    delete(path: string): Promise<boolean>;

    /**
     * Copy a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    copy(from: string, to: string): Promise<boolean>;

    /**
     * Move a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    move(from: string, to: string): Promise<boolean>;

    /**
     * Get the file size of a given file.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof Filesystem
     */
    size(path: string): Promise<number>;

    /**
     * Get the file's last modification time.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof Filesystem
     */
    lastModified(path: string): Promise<number>;

    /**
     * Get an array of all files in a directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof Filesystem
     */
    files(directory: string): Promise<string[]>;

    /**
     * Get all of the directories within a given directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof Filesystem
     */
    directories(directory: string): Promise<string[]>;

    /**
     * Create a directory.
     *
     * @param {*} path
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    makeDirectory(path): Promise<boolean>;

    /**
     * Recursively delete a directory.
     *
     * @param {string} directory
     * @returns {Promise<boolean>}
     * @memberof Filesystem
     */
    deleteDirectory(directory: string): Promise<boolean>;
}
