import { Transactions } from "@arkecosystem/crypto";
import BetterSqlite3 from "better-sqlite3";
import fs from "fs-extra";
import { MemPoolTransaction } from "./mem-pool-transaction";

/**
 * A permanent storage (on-disk), supporting some basic functionalities required
 * by the transaction pool.
 */
export class Storage {
    private readonly table: string = "pool";
    private db: BetterSqlite3.Database;

    /**
     * Construct the storage.
     */
    constructor(file: string) {
        fs.ensureFileSync(file);

        this.db = new BetterSqlite3(file);

        this.db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "sequence" INTEGER PRIMARY KEY,
        "id" VARCHAR(64) UNIQUE,
        "serialized" BLOB NOT NULL
      );
    `);
    }

    /**
     * Close the storage.
     */
    public close(): void {
        this.db.close();
        this.db = null;
    }

    /**
     * Add a bunch of new entries to the storage.
     */
    public bulkAdd(data: MemPoolTransaction[]): void {
        if (data.length === 0) {
            return;
        }

        const insertStatement = this.db.prepare(
            `INSERT INTO ${this.table} ` + "(sequence, id, serialized) VALUES " + "(:sequence, :id, :serialized);",
        );

        try {
            this.db.prepare("BEGIN;").run();

            data.forEach(d =>
                insertStatement.run({
                    sequence: d.sequence,
                    id: d.transaction.id,
                    serialized: d.transaction.serialized,
                }),
            );

            this.db.prepare("COMMIT;").run();
        } finally {
            if (this.db.inTransaction) {
                this.db.prepare("ROLLBACK;").run();
            }
        }
    }

    /**
     * Remove a bunch of entries, given their ids.
     */
    public bulkRemoveById(ids: string[]): void {
        if (ids.length === 0) {
            return;
        }

        const deleteStatement = this.db.prepare(`DELETE FROM ${this.table} WHERE id = :id;`);

        this.db.prepare("BEGIN;").run();

        ids.forEach(id => deleteStatement.run({ id }));

        this.db.prepare("COMMIT;").run();
    }

    /**
     * Load all entries.
     */
    public loadAll(): MemPoolTransaction[] {
        const rows = this.db.prepare(`SELECT sequence, lower(HEX(serialized)) AS serialized FROM ${this.table};`).all();

        return rows
            .map(r => ({ tx: Transactions.Transaction.fromHex(r.serialized), ...r }))
            .filter(r => r.tx.verified)
            .map(r => new MemPoolTransaction(r.tx, r.sequence));
    }

    /**
     * Delete all entries.
     */
    public deleteAll(): void {
        this.db.exec(`DELETE FROM ${this.table};`);
    }
}
