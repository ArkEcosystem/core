import { ensureFileSync, existsSync, readFileSync, writeFileSync } from "fs-extra";

class Storage {
    private readonly cache: string = `${process.env.CORE_PATH_CACHE}/elasticsearch.json`;

    public constructor() {
        if (!existsSync(this.cache)) {
            ensureFileSync(this.cache);

            this.write({
                lastRound: 0,
                lastBlock: 0,
                lastTransaction: 0,
            });
        }
    }

    public read() {
        return JSON.parse(readFileSync(this.cache).toString());
    }

    public write(data) {
        writeFileSync(this.cache, JSON.stringify(data, null, 4));
    }

    public update(data) {
        this.write({ ...this.read(), ...data });
    }

    public get(key) {
        return this.read()[key];
    }
}

export const storage = new Storage();
