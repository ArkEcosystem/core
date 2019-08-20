import {
    copyFile,
    ensureDir,
    lstat,
    move,
    pathExists,
    readdir,
    readFile,
    remove,
    rmdir,
    stat,
    writeFile,
} from "fs-extra";
import { resolve } from "path";
import { IFilesystem } from "../../../contracts/core-kernel";

export class Local implements IFilesystem {
    /**
     * Create a new instance of the filesystem.
     *
     * @returns {Promise<IFilesystem>}
     * @memberof IFilesystem
     */
    public async make(): Promise<IFilesystem> {
        return this;
    }

    /**
     * Determine if a file exists.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async exists(path: string): Promise<boolean> {
        return pathExists(path);
    }

    /**
     * Get the contents of a file.
     *
     * @param {string} path
     * @returns {Promise<Buffer>}
     * @memberof IFilesystem
     */
    public async get(path: string): Promise<Buffer> {
        return readFile(path);
    }

    /**
     * Write the contents of a file.
     *
     * @param {string} path
     * @param {string} contents
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async put(path: string, contents: string): Promise<boolean> {
        try {
            await writeFile(path, contents);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete the file at a given path.
     *
     * @param {string} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async delete(path: string): Promise<boolean> {
        try {
            await remove(path);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async copy(from: string, to: string): Promise<boolean> {
        try {
            await copyFile(from, to);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Move a file to a new location.
     *
     * @param {string} from
     * @param {string} to
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async move(from: string, to: string): Promise<boolean> {
        try {
            await move(from, to);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get the file size of a given file.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof IFilesystem
     */
    public async size(path: string): Promise<number> {
        return (await stat(path)).size;
    }

    /**
     * Get the file's last modification time.
     *
     * @param {string} path
     * @returns {Promise<number>}
     * @memberof IFilesystem
     */
    public async lastModified(path: string): Promise<number> {
        return +(await stat(path)).mtime;
    }

    /**
     * Get an array of all files in a directory.
     *
     * @param {string} directory
     * @returns {Promise<string[]>}
     * @memberof LocalAdapter
     */
    public async files(directory: string): Promise<string[]> {
        directory = resolve(directory);

        return (await readdir(directory))
            .map((item: string) => `${directory}/${item}`)
            .filter(async (item: string) => (await lstat(item)).isFile());
    }

    /**
     * Get all of the directories within a given directory.
     *
     * @param {string} directory
     * @returns {Promise<string>[]}
     * @memberof IFilesystem
     */
    public async directories(directory: string): Promise<string[]> {
        directory = resolve(directory);

        return (await readdir(directory))
            .map((item: string) => `${directory}/${item}`)
            .filter(async (item: string) => (await lstat(item)).isDirectory());
    }

    /**
     * Create a directory.
     *
     * @param {*} path
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async makeDirectory(path): Promise<boolean> {
        try {
            await ensureDir(path);

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Recursively delete a directory.
     *
     * @param {string} directory
     * @returns {Promise<boolean>}
     * @memberof IFilesystem
     */
    public async deleteDirectory(directory: string): Promise<boolean> {
        try {
            await rmdir(directory);

            return true;
        } catch {
            return false;
        }
    }
}
