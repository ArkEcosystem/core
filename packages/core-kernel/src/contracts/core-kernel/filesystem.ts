export interface IFilesystem {
    /**
     * Create a new instance of the filesystem.
     *
     * @returns {Promise<IFilesystem>}
     * @memberof IFilesystem
     */
    make(): Promise<IFilesystem>;

    /**
     * Determine if a file exists.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    exists(path: string): Promise<boolean>;

    /**
     * Get the contents of a file.
     *
     * @param {string} path
     * @returns {Promise<Buffer>}
     * @memberof IFilesystem
     */
    get(path: string): Promise<Buffer>;

    /**
     * Write the contents of a file.
     *
     * @param {string} path
     * @param {string} contents
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    put(path: string, contents: string): Promise<boolean>;

    /**
     * Delete the file at a given path.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    delete(path: string): Promise<boolean>;

    /**
     * Copy a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    copy(from: string, to: string): Promise<boolean>;

    /**
     * Move a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    move(from: string, to: string): Promise<boolean>;

    /**
     * Get the file size of a given file.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof IFilesystem
     */
    size(path: string): Promise<number>;

    /**
     * Get the file's last modification time.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof IFilesystem
     */
    lastModified(path: string): Promise<number>;

    /**
     * Get an array of all files in a directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof IFilesystem
     */
    files(directory: string): Promise<string[]>;

    /**
     * Get all of the directories within a given directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof IFilesystem
     */
    directories(directory: string): Promise<string[]>;

    /**
     * Create a directory.
     *
     * @param {*} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    makeDirectory(path): Promise<boolean>;

    /**
     * Recursively delete a directory.
     *
     * @param {string} directory
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    deleteDirectory(directory: string): Promise<boolean>;
}
