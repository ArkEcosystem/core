"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = require("assert");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_extra_1 = require("fs-extra");
class Storage {
    constructor() {
        this.table = "pool";
    }
    connect(file) {
        fs_extra_1.ensureFileSync(file);
        this.database = new better_sqlite3_1.default(file);
        this.database.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "id" VARCHAR(64) PRIMARY KEY,
        "serialized" BLOB NOT NULL
      );
    `);
    }
    disconnect() {
        this.database.close();
        this.database = undefined;
    }
    bulkAdd(data) {
        if (data.length === 0) {
            return;
        }
        const insertStatement = this.database.prepare(`INSERT INTO ${this.table} ` + "(id, serialized) VALUES " + "(:id, :serialized);");
        try {
            this.database.prepare("BEGIN;").run();
            for (const transaction of data) {
                insertStatement.run({ id: transaction.id, serialized: transaction.serialized });
            }
            this.database.prepare("COMMIT;").run();
        }
        finally {
            if (this.database.inTransaction) {
                this.database.prepare("ROLLBACK;").run();
            }
        }
    }
    bulkRemoveById(ids) {
        if (ids.length === 0) {
            return;
        }
        const deleteStatement = this.database.prepare(`DELETE FROM ${this.table} WHERE id = :id;`);
        this.database.prepare("BEGIN;").run();
        for (const id of ids) {
            deleteStatement.run({ id });
        }
        this.database.prepare("COMMIT;").run();
    }
    loadAll() {
        const rows = this.database
            .prepare(`SELECT id, LOWER(HEX(serialized)) AS serialized FROM ${this.table};`)
            .all();
        const transactions = [];
        const invalidIds = [];
        for (const row of rows) {
            try {
                const transaction = crypto_1.Transactions.TransactionFactory.fromHex(row.serialized);
                assert_1.strictEqual(row.id, transaction.id);
                transaction.isVerified ? transactions.push(transaction) : invalidIds.push(row.id);
            }
            catch (_a) {
                invalidIds.push(row.id);
            }
        }
        this.bulkRemoveById(invalidIds);
        return transactions;
    }
    deleteAll() {
        this.database.exec(`DELETE FROM ${this.table};`);
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map