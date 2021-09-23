"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
class Storage {
    constructor() {
        this.cache = `${process.env.CORE_PATH_CACHE}/elasticsearch.json`;
        if (!fs_extra_1.existsSync(this.cache)) {
            fs_extra_1.ensureFileSync(this.cache);
            this.write({
                lastRound: 0,
                lastBlock: 0,
                lastTransaction: 0,
            });
        }
    }
    read() {
        return JSON.parse(fs_extra_1.readFileSync(this.cache).toString());
    }
    write(data) {
        fs_extra_1.writeFileSync(this.cache, JSON.stringify(data, undefined, 4));
    }
    update(data) {
        this.write({ ...this.read(), ...data });
    }
    get(key) {
        return this.read()[key] || 0;
    }
}
exports.storage = new Storage();
//# sourceMappingURL=storage.js.map