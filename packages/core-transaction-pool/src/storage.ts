import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class Storage implements Contracts.TransactionPool.Storage {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: BetterSqlite3.Database;

    public boot(): void {
        const filename = this.configuration.getRequired<string>("storage");
        ensureFileSync(filename);

        this.database = new BetterSqlite3(filename);
        this.database.exec(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS pool (id VARCHAR(64) PRIMARY KEY, serialized BLOB NOT NULL);
        `);
    }

    public dispose(): void {
        this.database.close();
    }

    public hasTransaction(id: string): boolean {
        return this.database
            .prepare("SELECT COUNT(*) FROM pool WHERE id = ?")
            .pluck(true)
            .get(id) as boolean;
    }

    public getAllTransactions(): Interfaces.ITransaction[] {
        return this.database
            .prepare("SELECT LOWER(HEX(serialized)) FROM pool")
            .pluck(true)
            .all()
            .map(Transactions.TransactionFactory.fromHex);
    }

    public addTransaction(transaction: Interfaces.ITransaction): void {
        this.database.prepare("INSERT INTO pool (id, serialized) VALUES (:id, :serialized)").run({
            id: transaction.id,
            serialized: transaction.serialized,
        });
    }

    public removeTransaction(id: string): void {
        this.database.prepare("DELETE FROM pool WHERE id = ?").run(id);
    }

    public flush(): void {
        this.database.prepare("DELETE FROM pool").run();
    }
}
