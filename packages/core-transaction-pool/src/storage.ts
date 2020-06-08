import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
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
        return !!this.database.prepare("SELECT COUNT(*) FROM pool WHERE id = ?").pluck(true).get(id);
    }

    public getAllTransactions(): Iterable<{ id: string; serialized: Buffer }> {
        return this.database
            .prepare("SELECT id, LOWER(HEX(serialized)) AS hex FROM pool")
            .all()
            .map(({ id, hex }) => {
                return { id, serialized: Buffer.from(hex, "hex") };
            });
    }

    public addTransaction(id: string, serialized: Buffer): void {
        this.database.prepare("INSERT INTO pool (id, serialized) VALUES (:id, :serialized)").run({ id, serialized });
    }

    public removeTransaction(id: string): void {
        this.database.prepare("DELETE FROM pool WHERE id = ?").run(id);
    }

    public flush(): void {
        this.database.prepare("DELETE FROM pool").run();
    }
}
