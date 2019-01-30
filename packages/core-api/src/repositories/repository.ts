import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { TransactionPool } from "@arkecosystem/core-interfaces";
import snakeCase from "lodash/snakeCase";
import { IRepository } from "../interfaces";

export abstract class Repository implements IRepository {
    public database = app.resolvePlugin<PostgresConnection>("database");
    public cache = this.database.getCache();
    public transactionPool = app.resolvePlugin<TransactionPool.ITransactionPool>("transactionPool");
    public model = this.getModel();
    public query = this.model.query();
    public columns: string[] = [];

    protected constructor() {
        this.mapColumns();
    }

    // todo: Introduce a generic param to return type-safe models
    public abstract getModel(): any;

    public async find(query): Promise<any> {
        return this.database.query.oneOrNone(query.toQuery());
    }

    public async findMany(query): Promise<any> {
        return this.database.query.manyOrNone(query.toQuery());
    }

    public async findManyWithCount(selectQuery, { limit, offset, orderBy }): Promise<any> {
        if (this.columns.includes(orderBy[0])) {
            selectQuery.order(this.query[snakeCase(orderBy[0])][orderBy[1]]);
        }

        const offsetIsSet = Number.isInteger(offset) && offset > 0;
        const limitIsSet = Number.isInteger(limit);

        if (!offsetIsSet && !limitIsSet) {
            // tslint:disable-next-line:no-shadowed-variable
            const rows = await this.findMany(selectQuery);

            return { rows, count: rows.length };
        }

        selectQuery.offset(offset).limit(limit);

        const rows = await this.findMany(selectQuery);

        if (rows.length < limit) {
            return { rows, count: offset + rows.length };
        }

        // Get the last rows=... from something that looks like (1 column, few rows):
        //
        //                            QUERY PLAN
        // ------------------------------------------------------------------
        //  Limit  (cost=15.34..15.59 rows=100 width=622)
        //    ->  Sort  (cost=15.34..15.64 rows=120 width=622)
        //          Sort Key: "timestamp" DESC
        //          ->  Seq Scan on transactions  (cost=0.00..11.20 rows=120 width=622)

        let count = 0;
        const explainSql = `EXPLAIN ${selectQuery.toString()}`;
        for (const row of await this.database.query.manyOrNone(explainSql)) {
            const line: any = Object.values(row)[0];
            const match = line.match(/rows=([0-9]+)/);
            if (match !== null) {
                count = Number(match[1]);
            }
        }

        return { rows, count: Math.max(count, rows.length) };
    }

    protected mapColumns(): void {
        this.columns = [];

        for (const column of this.model.getColumnSet().columns) {
            this.columns.push(column.name);

            if (column.prop) {
                this.columns.push(column.prop);
            }
        }
    }

    private makeCountQuery(): Promise<any> {
        return this.query.select("count(*) AS count").from(this.query);
    }

    private makeEstimateQuery(): Promise<any> {
        return this.query.select("count(*) AS count").from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`);
    }

    private formatConditions(parameters): any {
        const columns = this.model.getColumnSet().columns.map(column => ({
            name: column.name,
            prop: column.prop || column.name,
        }));

        return Object.keys(parameters)
            .filter(arg => this.columns.includes(arg))
            .reduce((items, item) => {
                const column = columns.find(value => value.name === item || value.prop === item);

                column ? (items[column.name] = parameters[item]) : delete items[item];

                return items;
            }, {});
    }
}
