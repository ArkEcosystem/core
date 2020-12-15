import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class Storage implements Contracts.TransactionPool.Storage {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: BetterSqlite3.Database;
    private addTransactionStmt!: BetterSqlite3.Statement<Contracts.TransactionPool.StoredTransaction>;
    private hasTransactionStmt!: BetterSqlite3.Statement<{ id: string }>;
    private getAllTransactionsStmt!: BetterSqlite3.Statement<never[]>;
    private getOldTransactionsStmt!: BetterSqlite3.Statement<{ height: number }>;
    private removeTransactionStmt!: BetterSqlite3.Statement<{ id: string }>;
    private flushStmt!: BetterSqlite3.Statement<never[]>;

    public boot(): void {
        const filename = this.configuration.getRequired<string>("storage");
        ensureFileSync(filename);

        const table = "pool_20201204";

        this.database = new BetterSqlite3(filename);
        this.database.exec(`
            PRAGMA journal_mode = WAL;

            DROP TABLE IF EXISTS pool;

            CREATE TABLE IF NOT EXISTS ${table}(
                n                  INTEGER      PRIMARY KEY AUTOINCREMENT,
                height             INTEGER      NOT NULL,
                id                 VARCHAR(64)  NOT NULL,
                senderPublicKey    VARCHAR(66)  NOT NULL,
                serialized         BLOB         NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS ${table}_id ON ${table} (id);
            CREATE INDEX IF NOT EXISTS ${table}_height ON ${table} (height);
        `);

        this.addTransactionStmt = this.database.prepare(
            `INSERT INTO ${table} (height, id, senderPublicKey, serialized) VALUES (:height, :id, :senderPublicKey, :serialized)`,
        );

        this.hasTransactionStmt = this.database.prepare(`SELECT COUNT(*) FROM ${table} WHERE id = :id`).pluck(true);

        this.getAllTransactionsStmt = this.database.prepare(
            `SELECT height, id, senderPublicKey, serialized FROM ${table} ORDER BY n`,
        );

        this.getOldTransactionsStmt = this.database.prepare(
            `SELECT height, id, senderPublicKey, serialized FROM ${table} WHERE height <= :height ORDER BY n DESC`,
        );

        this.removeTransactionStmt = this.database.prepare(`DELETE FROM ${table} WHERE id = :id`);

        this.flushStmt = this.database.prepare(`DELETE FROM ${table}`);
    }

    public dispose(): void {
        this.database.close();
    }

    public addTransaction(storedTransaction: Contracts.TransactionPool.StoredTransaction): void {
        this.addTransactionStmt.run(storedTransaction);
    }

    public hasTransaction(id: string): boolean {
        return !!this.hasTransactionStmt.get({ id });
    }

    public getAllTransactions(): Iterable<Contracts.TransactionPool.StoredTransaction> {
        return this.getAllTransactionsStmt.all();
    }

    public getOldTransactions(height: number): Iterable<Contracts.TransactionPool.StoredTransaction> {
        return this.getOldTransactionsStmt.all({ height });
    }

    public removeTransaction(id: string): void {
        this.removeTransactionStmt.run({ id });
    }

    public flush(): void {
        this.flushStmt.run();
    }
}
