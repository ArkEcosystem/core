import { ensureFileSync, existsSync, readFileSync, writeFileSync } from "fs-extra";
import get from "lodash/get";

class Storage {
    private base: string;

    /**
     * Create a new storage instance.
     * @return {void}
     */
    constructor() {
        this.base = `${process.env.ARK_PATH_DATA}/plugins/core-elasticsearch`;
    }

    /**
     * Read & parse the specified file.
     * @param  {String} file
     * @return {Object}
     */
    public read(file) {
        if (!this.exists(file)) {
            return {};
        }

        return JSON.parse(readFileSync(`${this.base}/${file}.json`).toString());
    }

    /**
     * Write the specified data to the specified file.
     * @param  {String} file
     * @param  {Object} data
     * @return {void}
     */
    public write(file, data) {
        ensureFileSync(`${this.base}/${file}.json`);

        writeFileSync(`${this.base}/${file}.json`, JSON.stringify(data, null, 2));
    }

    /**
     * Update the specified data in the specified file.
     * @param  {String} file
     * @param  {Object} data
     * @return {void}
     */
    public update(file, data) {
        ensureFileSync(`${this.base}/${file}.json`);

        data = Object.assign(this.read(file), data);

        writeFileSync(`${this.base}/${file}.json`, JSON.stringify(data, null, 2));
    }

    /**
     * Update the specified data in the specified file.
     * @param  {String} file
     * @param  {Object} data
     * @return {void}
     */
    public ensure(file) {
        if (!this.exists(file)) {
            ensureFileSync(`${this.base}/${file}.json`);

            writeFileSync(
                `${this.base}/${file}.json`,
                JSON.stringify(
                    {
                        lastRound: 0,
                        lastBlock: 0,
                        lastTransaction: 0,
                    },
                    null,
                    2,
                ),
            );
        }
    }

    /**
     * Determine if the specified file exists.
     * @param  {String} file
     * @return {Boolean}
     */
    public exists(file) {
        return existsSync(`${this.base}/${file}.json`);
    }

    /**
     * Get a value from the specified file for the specified key.
     * @param  {String} file
     * @param  {String} key
     * @param  {*} key
     * @return {*}
     */
    public get(file, key, defaultValue = null) {
        return get(this.read(file), key, defaultValue);
    }
}

export const storage = new Storage();
