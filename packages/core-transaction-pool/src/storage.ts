import { Transactions } from "@arkecosystem/crypto";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";
import { MemoryTransaction } from "./memory-transaction";

export class Storage {
    private readonly table: string = "pool";
    private database: BetterSqlite3.Database;

    constructor(file: string) {
        ensureFileSync(file);

        this.database = new BetterSqlite3(file);

        this.database.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "sequence" INTEGER PRIMARY KEY,
        "id" VARCHAR(64) UNIQUE,
        "serialized" BLOB NOT NULL
      );
    `);
    }

    public close(): void {
        this.database.close();
        this.database = null;
    }

    public bulkAdd(data: MemoryTransaction[]): void {
        if (data.length === 0) {
            return;
        }

        const insertStatement = this.database.prepare(
            `INSERT INTO ${this.table} ` + "(sequence, id, serialized) VALUES " + "(:sequence, :id, :serialized);",
        );

        try {
            this.database.prepare("BEGIN;").run();

            for (const d of data) {
                insertStatement.run({
                    sequence: d.sequence,
                    id: d.transaction.id,
                    serialized: d.transaction.serialized,
                });
            }

            this.database.prepare("COMMIT;").run();
        } finally {
            if (this.database.inTransaction) {
                this.database.prepare("ROLLBACK;").run();
            }
        }
    }

    public bulkRemoveById(ids: string[]): void {
        if (ids.length === 0) {
            return;
        }

        const deleteStatement: BetterSqlite3.Statement = this.database.prepare(
            `DELETE FROM ${this.table} WHERE id = :id;`,
        );

        this.database.prepare("BEGIN;").run();

        for (const id of ids) {
            deleteStatement.run({ id });
        }

        this.database.prepare("COMMIT;").run();
    }

    public loadAll(): MemoryTransaction[] {
        const rows: Array<{ sequence: number; serialized: string }> = this.database
            .prepare(`SELECT sequence, lower(HEX(serialized)) AS serialized FROM ${this.table};`)
            .all();

        return rows
            .map(r => ({ transaction: Transactions.TransactionFactory.fromHex(r.serialized), ...r }))
            .filter(r => r.transaction.verified)
            .map(r => new MemoryTransaction(r.transaction, r.sequence));
    }

    public deleteAll(): void {
        this.database.exec(`DELETE FROM ${this.table};`);
    }
}
