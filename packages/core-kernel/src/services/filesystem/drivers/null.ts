import { Filesystem } from "../../../contracts/kernel/filesystem";
import { injectable } from "../../../ioc";

/**
 * @export
 * @class LocalFilesystem
 * @implements {Filesystem}
 */
@injectable()
export class NullFilesystem implements Filesystem {
    /**
     * Create a new instance of the filesystem.
     *
     * @returns {Promise<Filesystem>}
     * @memberof LocalFilesystem
     */
    public async make(): Promise<Filesystem> {
        return this;
    }

    /**
     * Determine if a file exists.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async exists(path: string): Promise<boolean> {
        return false;
    }

    /**
     * Get the contents of a file.
     *
     * @param {string} path
     * @returns {Promise<Buffer>}
     * @memberof LocalFilesystem
     */
    public async get(path: string): Promise<Buffer> {
        return Buffer.alloc(0);
    }

    /**
     * Write the contents of a file.
     *
     * @param {string} path
     * @param {string} contents
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async put(path: string, contents: string): Promise<boolean> {
        return false;
    }

    /**
     * Delete the file at a given path.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async delete(path: string): Promise<boolean> {
        return false;
    }

    /**
     * Copy a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async copy(from: string, to: string): Promise<boolean> {
        return false;
    }

    /**
     * Move a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async move(from: string, to: string): Promise<boolean> {
        return false;
    }

    /**
     * Get the file size of a given file.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof LocalFilesystem
     */
    public async size(path: string): Promise<number> {
        return 0;
    }

    /**
     * Get the file's last modification time.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof LocalFilesystem
     */
    public async lastModified(path: string): Promise<number> {
        return 0;
    }

    /**
     * Get an array of all files in a directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof LocalFilesystem
     */
    public async files(directory: string): Promise<string[]> {
        return [];
    }

    /**
     * Get all of the directories within a given directory.
     *
     * @param {string} directory
     * @returns {Promise<string>[]}
     * @memberof LocalFilesystem
     */
    public async directories(directory: string): Promise<string[]> {
        return [];
    }

    /**
     * Create a directory.
     *
     * @param {*} path
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async makeDirectory(path): Promise<boolean> {
        return false;
    }

    /**
     * Recursively delete a directory.
     *
     * @param {string} directory
     * @returns {Promise<boolean>}
     * @memberof LocalFilesystem
     */
    public async deleteDirectory(directory: string): Promise<boolean> {
        return false;
    }
}
