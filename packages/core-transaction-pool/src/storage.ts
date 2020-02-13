import { Container, Providers } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class Storage {
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

    public add(transaction: Interfaces.ITransaction): void {
        this.database.prepare("INSERT INTO pool (id, serialized) VALUES (:id, :serialized)").run({
            id: transaction.id,
            serialized: transaction.serialized,
        });
    }

    public delete(transaction: Interfaces.ITransaction): void {
        this.database.prepare("DELETE FROM pool WHERE id = ?").run(transaction.id);
    }

    public has(transaction: Interfaces.ITransaction): boolean {
        return this.database
            .prepare("SELECT COUNT(*) FROM pool WHERE id = ?")
            .pluck(true)
            .get(transaction.id) as boolean;
    }

    public clear(): void {
        this.database.prepare("DELETE FROM pool").run();
    }

    public all(): Interfaces.ITransaction[] {
        return this.database
            .prepare("SELECT LOWER(HEX(serialized)) FROM pool")
            .pluck(true)
            .all()
            .map(Transactions.TransactionFactory.fromHex);
    }
}
