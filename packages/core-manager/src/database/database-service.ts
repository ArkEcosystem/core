import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

// interface ConditionLine {
//     property: string;
//     condition: string;
//     value: string;
// }
//
// const conditions = new Map<string, string>([
//     ["$eq", "="],
//     ["$ne", "!="],
//     ["$lt", "<"],
//     ["$lte", "<="],
//     ["$gt", ">"],
//     ["$gte", ">="],
//     ["$like", "LIKE"],
// ]);

export interface Column {
    name: string;
    type: string;
    primary: boolean | undefined;
    autoincrement: boolean | undefined;
    nullable: boolean | undefined;
    default: string | undefined;
}

export interface Table {
    name: string;
    columns: Column[];
}

export interface Schema {
    tables: Table[];
}

export class DatabaseService {
    protected database!: BetterSqlite3.Database;

    public constructor(private readonly filename: string, protected readonly schema: Schema) {
        ensureFileSync(this.filename);
        this.database = new BetterSqlite3(filename);
    }

    public boot(flush: boolean = false): void {
        this.exec(this.createDatabaseSQL());

        // if (flush) {
        //     this.flush();
        // }
    }

    private exec(sql: string): any {
        this.database.exec(sql);
    }

    private createDatabaseSQL(): string {
        let result = "PRAGMA journal_mode = WAL;\n";

        for (const table of this.schema.tables) {
            result += this.createTableSQL(table) + "\n";
        }

        return result;
    }

    private createTableSQL(table: Table): string {
        let result = `CREATE TABLE IF NOT EXISTS ${table.name} (`;

        for (const column of table.columns) {
            result += this.createColumnSQL(column);

            if (table.columns[table.columns.length - 1] !== column) {
                result += ", ";
            }
        }

        result += ");";

        return result;
    }

    private createColumnSQL(column: Column): string {
        let result = `${column.name} ${column.type}`;

        if (column.primary) {
            result += " PRIMARY KEY";

            if (column.autoincrement) {
                result += " AUTOINCREMENT";
            }
        }

        if (!column.nullable) {
            result += " NOT NULL";
        }

        if (column.default) {
            result += ` DEFAULT ${column.default}`;
        }

        return result;
    }

    //
    // public dispose(): void {
    //     this.database.close();
    // }
    //
    // public flush(): void {
    //     this.database.prepare(`DELETE FROM ${this.table}`).run();
    // }
    //
    // public getAll(): any[] {
    //     return this.database.prepare(`SELECT * FROM ${this.table}`).pluck(false).all();
    // }
    //
    // public getTotal(conditions?: any): number {
    //     return this.database
    //         .prepare(`SELECT COUNT(*) FROM ${this.table} ${this.prepareWhere(conditions)}`)
    //         .get()["COUNT(*)"] as number;
    // }
    //
    // public query(conditions?: any): any {
    //     const limit = this.prepareLimit(conditions);
    //     const offset = this.prepareOffset(conditions);
    //
    //     return {
    //         total: this.getTotal(conditions),
    //         limit,
    //         offset,
    //         data: this.database
    //             .prepare(
    //                 `SELECT * FROM ${this.table} ${this.prepareWhere(
    //                     conditions,
    //                 )} LIMIT ${limit} OFFSET ${offset}`,
    //             )
    //             .pluck(false)
    //             .all(),
    //     };
    // }
    //
    // private prepareLimit(conditions?: any): number {
    //     if (conditions?.$limit && typeof conditions.$limit === "number" && conditions.$limit <= 1000) {
    //         return conditions.$limit;
    //     }
    //
    //     return 10;
    // }
    //
    // private prepareOffset(conditions?: any): number {
    //     if (conditions?.$offset && typeof conditions.$offset === "number") {
    //         return conditions.$offset;
    //     }
    //
    //     return 0;
    // }
    //
    // private prepareWhere(conditions?: any): string {
    //     let query = "";
    //
    //     const extractedConditions = this.extractWhereConditions(conditions);
    //
    //     if (extractedConditions.length > 0) {
    //         query += "WHERE " + extractedConditions[0];
    //     }
    //
    //     for (let i = 1; i < extractedConditions.length; i++) {
    //         query += " AND " + extractedConditions[i];
    //     }
    //
    //     return query;
    // }
    //
    // private extractWhereConditions(conditions?: any): string[] {
    //     let result: string[] = [];
    //
    //     if (!conditions) {
    //         return [];
    //     }
    //
    //     for (const key of Object.keys(conditions)) {
    //         if (key === "event") {
    //             result = [
    //                 ...result,
    //                 ...this.extractConditions(conditions[key], key).map((x) => this.conditionLineToSQLCondition(x)),
    //             ];
    //         }
    //         if (key === "data") {
    //             result = [
    //                 ...result,
    //                 ...this.extractConditions(conditions[key], "$").map((x) =>
    //                     this.conditionLineToSQLCondition(x, key),
    //                 ),
    //             ];
    //         }
    //     }
    //
    //     return result;
    // }
    //
    // private conditionLineToSQLCondition(conditionLine: ConditionLine, jsonExtractProperty?: string): string {
    //     const useQuote = typeof conditionLine.value !== "number";
    //
    //     if (jsonExtractProperty) {
    //         // Example: json_extract(data, '$.publicKey') = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
    //         // prettier-ignore
    //         return `json_extract(${jsonExtractProperty}, '${conditionLine.property}') ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${conditionLine.value}${useQuote ? "'" : ""}`;
    //     }
    //
    //     // Example: event LIKE 'wallet'
    //     // prettier-ignore
    //     return `${conditionLine.property} ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${conditionLine.value}${useQuote ? "'" : ""}`;
    // }
    //
    // private extractConditions(data: any, property: string): ConditionLine[] {
    //     let result: ConditionLine[] = [];
    //
    //     /* istanbul ignore next */
    //     if (!data) {
    //         /* istanbul ignore next */
    //         return [];
    //     }
    //
    //     if (typeof data !== "object") {
    //         result.push({
    //             property: `${property}`,
    //             condition: "$eq",
    //             value: data,
    //         });
    //
    //         return result;
    //     }
    //
    //     for (const key of Object.keys(data)) {
    //         if (key.startsWith("$")) {
    //             result.push({
    //                 property: property,
    //                 condition: key,
    //                 value: data[key],
    //             });
    //         } else {
    //             result = [...result, ...this.extractConditions(data[key], `${property}.${key}`)];
    //         }
    //     }
    //
    //     return result;
    // }
}
