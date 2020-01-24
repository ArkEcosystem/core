import { Container, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { strictEqual } from "assert";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

/**
 * @export
 * @class Storage
 */
@Container.injectable()
export class Storage {
    /**
     * @private
     * @type {Providers.PluginConfiguration}
     * @memberof Storage
     */
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    /**
     * @private
     * @type {string}
     * @memberof Storage
     */
    private readonly table: string = "pool";

    /**
     * @private
     * @type {BetterSqlite3.Database}
     * @memberof Storage
     */
    private database!: BetterSqlite3.Database;

    /**
     * @memberof Storage
     */
    public connect() {
        ensureFileSync(this.configuration.getRequired<string>("storage"));

        this.database = new BetterSqlite3(this.configuration.getRequired<string>("storage"));

        this.database.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS ${this.table} (
        "id" VARCHAR(64) PRIMARY KEY,
        "serialized" BLOB NOT NULL
      );
    `);
    }

    /**
     * @memberof Storage
     */
    public disconnect(): void {
        this.database.close();
    }

    /**
     * @param {Interfaces.ITransaction[]} data
     * @returns {void}
     * @memberof Storage
     */
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

    /**
     * @param {string[]} ids
     * @returns {void}
     * @memberof Storage
     */
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

    /**
     * @returns {Interfaces.ITransaction[]}
     * @memberof Storage
     */
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

    /**
     * @memberof Storage
     */
    public deleteAll(): void {
        this.database.exec(`DELETE FROM ${this.table};`);
    }
}
