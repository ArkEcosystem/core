import { DatabaseService } from "./database-service";

export class EventsDatabaseService extends DatabaseService {
    public constructor(filename: string) {
        super(filename, "events");
    }

    public boot(flush: boolean = false): void {
        this.database.exec(`
            PRAGMA journal_mode = WAL;
            CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, event VARCHAR(255) NOT NULL, data JSON NOT NULL, timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
        `);

        super.boot(flush);
    }

    public getAll(): any[] {
        return this.transform(super.getAll());
    }

    private transform(data: any[]) {
        return data.map((x) => {
            x.data = JSON.parse(x.data);
            return x;
        });
    }
}
