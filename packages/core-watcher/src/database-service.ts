import { Container, Providers } from "@arkecosystem/core-kernel";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

@Container.injectable()
export class DatabaseService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-watcher")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: BetterSqlite3.Database;

    public boot(): void {
        const filename = this.configuration.getRequired<string>("storage");
        ensureFileSync(filename);

        this.database = new BetterSqlite3(filename);
        this.database.exec(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, event VARCHAR(255) NOT NULL, data JSON NOT NULL, timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
        `);
    }

    public dispose(): void {
        this.database.close();
    }

    public flush(): void {
        this.database.prepare("DELETE FROM events").run();
    }

    public addEvent(event: string, data: any): void {
        this.database.prepare("INSERT INTO events (event, data) VALUES (:event, json(:data))").run({
            event: event,
            data: JSON.stringify(data),
        });
    }

    public getAllEvents(): any[] {
        return this.database
            .prepare("SELECT * FROM events")
            .pluck(false)
            .all()
            .map((x) => {
                x.data = JSON.parse(x.data);
                return x;
            });
    }
}
