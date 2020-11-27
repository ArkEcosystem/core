import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

interface ConditionLine {
    property: string;
    condition: string;
    value: string;
}

const conditions = new Map<string, string>([
    ["$eq", "="],
    ["$ne", "!="],
    ["$lt", "<"],
    ["$lte", "<="],
    ["$gt", ">"],
    ["$gte", ">="],
    ["$like", "LIKE"],
]);

export class DatabaseService {
    protected database!: BetterSqlite3.Database;

    public constructor(private readonly filename: string, private readonly databaseName: string) {
        ensureFileSync(this.filename);
        this.database = new BetterSqlite3(filename);
    }

    public boot(flush: boolean = false): void {
        if (flush) {
            this.flush();
        }
    }

    public dispose(): void {
        this.database.close();
    }

    public flush(): void {
        this.database.prepare(`DELETE FROM ${this.databaseName}`).run();
    }

    public add(event: string, data: any): void {
        this.database.prepare("INSERT INTO events (event, data) VALUES (:event, json(:data))").run({
            event: event,
            data: JSON.stringify(data || {}),
        });
    }

    public getAll(): any[] {
        return this.database.prepare(`SELECT * FROM ${this.databaseName}`).pluck(false).all();
    }

    public getTotal(conditions?: any): number {
        return this.database
            .prepare(`SELECT COUNT(*) FROM ${this.databaseName} ${this.prepareWhere(conditions)}`)
            .get()["COUNT(*)"] as number;
    }

    public query(conditions?: any): any {
        const limit = this.prepareLimit(conditions);
        const offset = this.prepareOffset(conditions);

        return {
            total: this.getTotal(conditions),
            limit,
            offset,
            data: this.database
                .prepare(
                    `SELECT * FROM ${this.databaseName} ${this.prepareWhere(
                        conditions,
                    )} LIMIT ${limit} OFFSET ${offset}`,
                )
                .pluck(false)
                .all(),
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

        if (!conditions) {
            return [];
        }

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
        const useQuote = typeof conditionLine.value !== "number";

        if (jsonExtractProperty) {
            // Example: json_extract(data, '$.publicKey') = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
            // prettier-ignore
            return `json_extract(${jsonExtractProperty}, '${conditionLine.property}') ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${conditionLine.value}${useQuote ? "'" : ""}`;
        }

        // Example: event LIKE 'wallet'
        // prettier-ignore
        return `${conditionLine.property} ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${conditionLine.value}${useQuote ? "'" : ""}`;
    }

    private extractConditions(data: any, property: string): ConditionLine[] {
        let result: ConditionLine[] = [];

        /* istanbul ignore next */
        if (!data) {
            /* istanbul ignore next */
            return [];
        }

        if (typeof data !== "object") {
            result.push({
                property: `${property}`,
                condition: "$eq",
                value: data,
            });

            return result;
        }

        for (const key of Object.keys(data)) {
            if (key.startsWith("$")) {
                result.push({
                    property: property,
                    condition: key,
                    value: data[key],
                });
            } else {
                result = [...result, ...this.extractConditions(data[key], `${property}.${key}`)];
            }
        }

        return result;
    }
}
