"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const lowdb_1 = __importDefault(require("lowdb"));
const FileSync_1 = __importDefault(require("lowdb/adapters/FileSync"));
const v4_1 = __importDefault(require("uuid/v4"));
class Database {
    make() {
        const adapterFile = `${process.env.CORE_PATH_CACHE}/webhooks.json`;
        if (!fs_extra_1.existsSync(adapterFile)) {
            fs_extra_1.ensureFileSync(adapterFile);
        }
        this.database = lowdb_1.default(new FileSync_1.default(adapterFile));
        this.database.defaults({ webhooks: [] }).write();
    }
    all() {
        return this.database.get("webhooks", []).value();
    }
    hasById(id) {
        return !!this.findById(id);
    }
    findById(id) {
        try {
            return this.database
                .get("webhooks")
                .find({ id })
                .value();
        }
        catch (error) {
            return undefined;
        }
    }
    findByEvent(event) {
        return this.database
            .get("webhooks")
            .filter({ event })
            .value();
    }
    create(data) {
        data.id = v4_1.default();
        this.database
            .get("webhooks")
            .push(data)
            .write();
        return this.findById(data.id);
    }
    update(id, data) {
        return this.database
            .get("webhooks")
            .find({ id })
            .assign(data)
            .write();
    }
    destroy(id) {
        this.database
            .get("webhooks")
            .remove({ id })
            .write();
    }
    reset() {
        fs_extra_1.removeSync(`${process.env.CORE_PATH_CACHE}/webhooks.json`);
        this.make();
    }
}
exports.database = new Database();
//# sourceMappingURL=database.js.map