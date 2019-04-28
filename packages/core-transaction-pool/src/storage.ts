import { Interfaces, Transactions } from "@arkecosystem/crypto";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

export class Storage {
    private readonly table: string = "pool";
    private database: BetterSqlite3.Database;

    public connect(file: string) {
        ensureFileSync(file);

        this.database = new BetterSqlite3(file);

        this.database.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "id" VARCHAR(64) PRIMARY KEY,
        "serialized" BLOB NOT NULL
      );
    `);
    }

    public disconnect(): void {
        this.database.close();
        this.database = null;
    }

    public bulkAdd(data: Interfaces.ITransaction[]): void {
        if (data.length === 0) {
            return;
        }

        const insertStatement: BetterSqlite3.Statement = this.database.prepare(
            `INSERT INTO ${this.table} ` + "(id, serialized) VALUES " + "(:id, :serialized);",
        );

        try {
            this.database.prepare("BEGIN;").run();

            for (const transaction of data) {
                insertStatement.run({ id: transaction.id, serialized: transaction.serialized });
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

    public loadAll(): Interfaces.ITransaction[] {
        const rows: Array<{ serialized: string }> = this.database
            .prepare(`SELECT LOWER(HEX(serialized)) AS serialized FROM ${this.table};`)
            .all();

        return rows.map(r => Transactions.TransactionFactory.fromHex(r.serialized)).filter(t => t.verified);
    }

    public deleteAll(): void {
        this.database.exec(`DELETE FROM ${this.table};`);
    }
}
