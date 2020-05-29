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

    public getTotal(conditions?: any): number {
        return this.database.prepare(`SELECT COUNT(*) FROM events ${this.prepareWhere(conditions)}`).get()[
            "COUNT(*)"
        ] as number;
    }

    public queryEvents(conditions?: any): any {
        const limit = this.prepareLimit(conditions);
        const offset = this.prepareOffset(conditions);

        return {
            total: this.getTotal(conditions),
            limit,
            offset,
            data: this.database
                .prepare(`SELECT * FROM events ${this.prepareWhere(conditions)} LIMIT ${limit} OFFSET ${offset}`)
                .pluck(false)
                .all()
                .map((x) => {
                    x.data = JSON.parse(x.data);
                    return x;
                }),
        };
    }

    private prepareLimit(conditions?: any): number {
        if (conditions?.limit && typeof conditions.limit === "number" && conditions.limit <= 1000) {
            return conditions.limit;
        }

        return 10;
    }

    private prepareOffset(conditions?: any): number {
        if (conditions?.offset && typeof conditions.offset === "number") {
            return conditions.offset;
        }

        return 0;
    }

    private prepareWhere(conditions?: any): string {
        let query = "";

        if (!conditions) {
            return query;
        }

        for (const key of Object.keys(conditions)) {
            if (key === "event") {
                query += `WHERE event LIKE '${conditions[key]}%'`;
            }
        }

        return query;
    }
}
