import { ensureFileSync, existsSync, readFileSync, writeFileSync } from "fs-extra";
import get from "lodash/get";

class Storage {
    private cacheFile: string = `${process.env.CORE_PATH_CACHE}/elasticsearch.json`;

    public read() {
        return JSON.parse(readFileSync(this.cacheFile).toString());
    }

    public write(data) {
        ensureFileSync(this.cacheFile);

        writeFileSync(this.cacheFile, JSON.stringify(data, null, 4));
    }

    public update(data) {
        ensureFileSync(this.cacheFile);

        data = Object.assign(this.read(), data);

        writeFileSync(this.cacheFile, JSON.stringify(data, null, 4));
    }

    public ensure() {
        if (!this.exists()) {
            ensureFileSync(this.cacheFile);

            writeFileSync(
                this.cacheFile,
                JSON.stringify(
                    {
                        lastRound: 0,
                        lastBlock: 0,
                        lastTransaction: 0,
                    },
                    null,
                    4,
                ),
            );
        }
    }

    public exists() {
        return existsSync(this.cacheFile);
    }

    public get(key, defaultValue = null) {
        return get(this.read(), key, defaultValue);
    }
}

export const storage = new Storage();
