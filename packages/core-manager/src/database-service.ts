import { Container, Providers } from "@arkecosystem/core-kernel";
import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

interface ConditionLine {
    property: string;
    condition: string;
    value: string;
}

const conditions = new Map<string, string>([
    ["$eq", "="],
    ["$like", "LIKE"],
]);

@Container.injectable()
export class DatabaseService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-manager")
    private readonly configuration!: Providers.PluginConfiguration;

    private database!: BetterSqlite3.Database;

    public boot(): void {
        const filename = this.configuration.getRequired<{ storage: string }>("watcher").storage;
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
            data: JSON.stringify(data || {}),
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
                .prepare(
                    `SELECT *, json_extract(data, '$.publicKey') FROM events, json_tree(data) ${this.prepareWhere(
                        conditions,
                    )} LIMIT ${limit} OFFSET ${offset}`,
                )
                .pluck(false)
                .all()
                .map((x) => {
                    x.data = JSON.parse(x.data);
                    return x;
                }),
        };
    }

    private prepareLimit(conditions?: any): number {
        if (conditions?.$limit && typeof conditions.$limit === "number" && conditions.$limit <= 1000) {
            return conditions.$limit;
        }

        return 10;
    }

    private prepareOffset(conditions?: any): number {
        if (conditions?.$offset && typeof conditions.$offset === "number") {
            return conditions.$offset;
        }

        return 0;
    }

    private prepareWhere(conditions?: any): string {
        let query = "";

        const extractedConditions = this.extractWhereConditions(conditions);

        if (extractedConditions.length > 0) {
            query += "WHERE " + extractedConditions[0];
        }

        for (let i = 1; i < extractedConditions.length; i++) {
            query += " AND " + extractedConditions[i];
        }

        return query;
    }

    private extractWhereConditions(conditions?: any): string[] {
        let result: string[] = [];

        for (const key of Object.keys(conditions)) {
            if (key === "event") {
                result = [
                    ...result,
                    ...this.extractConditions(conditions[key], key).map((x) => this.conditionLineToSQLCondition(x)),
                ];
            }
            if (key === "data") {
                result = [
                    ...result,
                    ...this.extractConditions(conditions[key], "$").map((x) =>
                        this.conditionLineToSQLCondition(x, key),
                    ),
                ];
            }
        }

        return result;
    }

    private conditionLineToSQLCondition(conditionLine: ConditionLine, jsonExtractProperty?: string): string {
        if (jsonExtractProperty) {
            // Example: json_extract(data, '$.publicKey') = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
            // prettier-ignore
            return `json_extract(${jsonExtractProperty}, '${conditionLine.property}') ${conditions.get(conditionLine.condition)} '${conditionLine.value}'`;
        }

        // Example: event LIKE 'wallet'
        return `${conditionLine.property} ${conditions.get(conditionLine.condition)} '${conditionLine.value}'`;
    }

    private extractConditions(data: any, property: string): ConditionLine[] {
        let result: ConditionLine[] = [];

        if (!data) {
            return [];
        }

        if (typeof data !== "object") {
            result.push({
                property: `${property}`,
                condition: "$eq",
                value: data.toString(),
            });

            return result;
        }

        for (const key of Object.keys(data)) {
            if (key.startsWith("$")) {
                result.push({
                    property: property,
                    condition: key,
                    value: data[key].toString(),
                });
            } else {
                result = [...result, ...this.extractConditions(data[key], `${property}.${key}`)];
            }
        }

        return result;
    }
}
