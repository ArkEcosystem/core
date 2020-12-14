import BetterSqlite3 from "better-sqlite3";
import { ensureFileSync } from "fs-extra";

interface Options {
    defaultLimit: number;
    maxLimit: number;
}

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
    ["$in", "IN"],
]);

export interface Column {
    name: string;
    type: string;
    primary?: boolean;
    autoincrement?: boolean;
    nullable?: boolean;
    default?: string;
    index?: boolean;
}

export interface Table {
    name: string;
    columns: Column[];
}

export interface Schema {
    tables: Table[];
}

export interface Result {
    total: number;
    limit: number;
    offset: number;
    data: any[];
}

export class Database {
    protected options: Options;

    protected database!: BetterSqlite3.Database;

    public constructor(
        private readonly filename: string,
        protected readonly schema: Schema,
        options: Partial<Options> = {},
    ) {
        this.options = {
            defaultLimit: 100,
            maxLimit: 1000,
            ...options,
        };

        ensureFileSync(this.filename);
        this.database = new BetterSqlite3(filename);
    }

    public isOpen(): boolean {
        return this.database.open;
    }

    public boot(flush: boolean = false): void {
        this.exec(this.createDatabaseSQL());

        if (flush) {
            this.flush();
        }
    }

    public dispose(): void {
        this.database.close();
    }

    public flush(): void {
        for (const table of this.schema.tables) {
            this.database.prepare(`DELETE FROM ${table.name}`).run();
        }
    }

    public getAll(tableName: string, conditions?: any): any[] {
        const table = this.getTable(tableName);

        const result = this.database
            .prepare(
                `SELECT * FROM ${table.name} ${this.prepareWhere(table, conditions)} ${this.prepareOrderBy(
                    conditions,
                )}`,
            )
            .pluck(false)
            .all();

        return this.transform(table, result);
    }

    public getAllIterator(tableName: string, conditions?: any): IterableIterator<any> {
        const table = this.getTable(tableName);

        return this.database
            .prepare(
                `SELECT * FROM ${table.name} ${this.prepareWhere(table, conditions)} ${this.prepareOrderBy(
                    conditions,
                )}`,
            )
            .pluck(false)
            .iterate();
    }

    public add(tableName: string, data: any): void {
        const table = this.getTable(tableName);

        this.database.prepare(this.prepareInsertSQL(table, data)).run(this.prepareInsertData(table, data));
    }

    public getTotal(tableName: string, conditions?: any): number {
        const table = this.getTable(tableName);

        return this.database
            .prepare(`SELECT COUNT(*) FROM ${table.name} ${this.prepareWhere(table, conditions)}`)
            .get()["COUNT(*)"] as number;
    }

    public find(tableName: string, conditions?: any): Result {
        const table = this.getTable(tableName);

        const limit = this.prepareLimit(conditions);
        const offset = this.prepareOffset(conditions);

        return {
            total: this.getTotal(tableName, conditions),
            limit,
            offset,
            data: this.transform(
                table,
                this.database
                    .prepare(
                        `SELECT * FROM ${table.name} ${this.prepareWhere(table, conditions)} ${this.prepareOrderBy(
                            conditions,
                        )} LIMIT ${limit} OFFSET ${offset};`,
                    )
                    .pluck(false)
                    .all(),
            ),
        };
    }

    public remove(tableName: string, conditions?: any): void {
        const table = this.getTable(tableName);

        this.database.exec(`DELETE FROM ${table.name} ${this.prepareWhere(table, conditions)}`);
    }

    private getTable(tableName: string): Table {
        const table = this.schema.tables.find((table) => table.name === tableName);

        if (!table) {
            throw new Error(`Table ${tableName} does not exists.`);
        }

        return table;
    }

    private transform(table: Table, data: any[]): any[] {
        const jsonColumns = table.columns.filter((column) => column.type === "json");

        if (jsonColumns.length) {
            return data.map((item) => {
                for (const jsonColumn of jsonColumns) {
                    item[jsonColumn.name] = JSON.parse(item[jsonColumn.name]);
                }

                return item;
            });
        }

        return data;
    }

    private prepareInsertData(table: Table, data: any) {
        const result = {};

        for (const column of this.getInsertColumns(table, data)) {
            if (column.type === "json") {
                result[column.name] = JSON.stringify(data[column.name]);
            } else {
                result[column.name] = data[column.name];
            }
        }

        return result;
    }

    private prepareInsertSQL(table: Table, data: any): string {
        const columns = this.getInsertColumns(table, data);

        let result = `INSERT INTO ${table.name} (`;

        for (const column of columns) {
            result += column.name;

            if (columns[columns.length - 1] !== column) {
                result += ", ";
            }
        }

        result += ") VALUES (";

        for (const column of columns) {
            if (column.type === "json") {
                result += `json(:${column.name})`;
            } else {
                result += `:${column.name}`;
            }

            if (columns[columns.length - 1] !== column) {
                result += ", ";
            }
        }

        result += ")";

        return result;
    }

    private getInsertColumns(table: Table, data: any): Column[] {
        const result: Column[] = [];

        for (const key of Object.keys(data)) {
            const column = table.columns.find((column) => column.name === key);
            if (column) {
                result.push(column);
            }
        }

        return result;
    }

    private exec(sql: string): any {
        this.database.exec(sql);
    }

    private createDatabaseSQL(): string {
        let result = "PRAGMA journal_mode = WAL;\n";

        for (const table of this.schema.tables) {
            result += this.createTableSQL(table) + "\n";
        }

        result += this.createIndexesSQL();

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
        let result = `${column.name} ${column.type.toUpperCase()}`;

        if (column.primary) {
            result += " PRIMARY KEY";

            /* istanbul ignore else */
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

    private createIndexesSQL(): string {
        let result = "";

        for (const table of this.schema.tables) {
            for (const column of table.columns) {
                if (column.index) {
                    result += `CREATE INDEX IF NOT EXISTS index_${table.name}_${column.name} ON ${table.name} (${column.name});\n`;
                }
            }
        }

        return result;
    }

    private prepareLimit(conditions?: any): number {
        if (conditions?.$limit && typeof conditions.$limit === "number") {
            if (conditions.$limit <= this.options.maxLimit) {
                return conditions.$limit;
            }
            return this.options.maxLimit;
        }

        return this.options.defaultLimit;
    }

    private prepareOffset(conditions?: any): number {
        if (conditions?.$offset && typeof conditions.$offset === "number") {
            return conditions.$offset;
        }

        return 0;
    }

    private prepareOrderBy(conditions?: any): string {
        let result = "";

        if (conditions && conditions.$order && Object.keys(conditions.$order).length >= 1) {
            result = "ORDER BY";

            const keys = Object.keys(conditions.$order);
            for (const key of keys) {
                result += ` ${key} ${conditions.$order[key] === "DESC" ? "DESC" : "ASC"}`;

                if (keys[keys.length - 1] !== key) {
                    result += ",";
                }
            }
        }

        return result;
    }

    private prepareWhere(table: Table, conditions?: any): string {
        let query = "";

        const extractedConditions = this.extractWhereConditions(table, conditions);

        if (extractedConditions.length > 0) {
            query += "WHERE " + extractedConditions[0];
        }

        for (let i = 1; i < extractedConditions.length; i++) {
            query += " AND " + extractedConditions[i];
        }

        return query;
    }

    private extractWhereConditions(table: Table, conditions?: any): string[] {
        let result: string[] = [];

        if (!conditions) {
            return [];
        }

        for (const key of Object.keys(conditions)) {
            if (["$offset", "$limit", "$order"].includes(key)) {
                continue;
            }

            const column = table.columns.find((column) => column.name === key);

            if (!column) {
                throw new Error(`Column ${key} does not exist on table ${table.name}.`);
            }

            if (column.type === "json") {
                result = [
                    ...result,
                    ...this.extractConditions(conditions[key], "$").map((x) =>
                        this.conditionLineToSQLCondition(x, key),
                    ),
                ];
            } else {
                result = [
                    ...result,
                    ...this.extractConditions(conditions[key], key).map((x) => this.conditionLineToSQLCondition(x)),
                ];
            }
        }

        return result;
    }

    private prepareValue(value: any) {
        if (Array.isArray(value)) {
            let result = "(";

            for (const item of value) {
                if (typeof item === "number") {
                    result += `${item}`;
                } else {
                    result += `'${item}'`;
                }

                if (value[value.length - 1] !== item) {
                    result += ",";
                }
            }

            result += ")";

            return result;
        }

        return value;
    }

    private useQuote(value: any) {
        if (Array.isArray(value)) {
            return false;
        }

        return typeof value !== "number";
    }

    private conditionLineToSQLCondition(conditionLine: ConditionLine, jsonExtractProperty?: string): string {
        const useQuote = this.useQuote(conditionLine.value);

        if (jsonExtractProperty) {
            // Example: json_extract(data, '$.publicKey') = '0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647'
            // prettier-ignore
            return `json_extract(${jsonExtractProperty}, '${conditionLine.property}') ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${this.prepareValue(conditionLine.value)}${useQuote ? "'" : ""}`;
        }

        // Example: event LIKE 'wallet'
        // prettier-ignore
        return `${conditionLine.property} ${conditions.get(conditionLine.condition)} ${useQuote ? "'" : ""}${this.prepareValue(conditionLine.value)}${useQuote ? "'" : ""}`;
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
