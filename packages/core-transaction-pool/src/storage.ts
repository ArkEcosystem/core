import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
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
        this.database = undefined;
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
        const rows: Array<{ id: string; serialized: string }> = this.database
            .prepare(`SELECT id, LOWER(HEX(serialized)) AS serialized FROM ${this.table};`)
            .all();

        const transactions: Interfaces.ITransaction[] = [];

        const invalidIds: string[] = [];
        for (const row of rows) {
            try {
                const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromHex(row.serialized);

                strictEqual(row.id, transaction.id);

                transaction.isVerified ? transactions.push(transaction) : invalidIds.push(row.id);
            } catch {
                invalidIds.push(row.id);
            }
        }

        this.bulkRemoveById(invalidIds);

        return transactions;
    }

    public deleteAll(): void {
        this.database.exec(`DELETE FROM ${this.table};`);
    }
}
