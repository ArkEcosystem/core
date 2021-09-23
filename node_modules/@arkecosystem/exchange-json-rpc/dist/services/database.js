"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_extra_1 = require("fs-extra");
const json_buffer_1 = __importDefault(require("json-buffer"));
const sql_1 = __importDefault(require("sql"));
class Database {
    connect(file) {
        fs_extra_1.ensureFileSync(file);
        this.database = new better_sqlite3_1.default(file);
        sql_1.default.setDialect("sqlite");
        // @ts-ignore
        this.table = sql_1.default.define({
            columns: [
                {
                    dataType: `VARCHAR(255)`,
                    name: "key",
                    primaryKey: true,
                },
                {
                    dataType: "TEXT",
                    name: "value",
                },
            ],
            name: "keyv",
        });
        this.database.exec(this.table
            .create()
            .ifNotExists()
            .toString());
    }
    async get(key) {
        const row = this.database
            .prepare(this.table
            .select(this.table.value)
            .where({ key: this.getKeyPrefix(key) })
            .toString())
            .get();
        if (!row) {
            return undefined;
        }
        try {
            return json_buffer_1.default.parse(row.value).value;
        }
        catch (err) {
            return undefined;
        }
    }
    async set(key, value) {
        this.database.exec(this.table.replace({ key: this.getKeyPrefix(key), value: json_buffer_1.default.stringify({ value }) }).toString());
    }
    getKeyPrefix(key) {
        return `keyv:${key}`;
    }
}
exports.database = new Database();
//# sourceMappingURL=database.js.map