import { Database } from "@arkecosystem/core-interfaces";
import { IMain } from "pg-promise";
import { Executable, Query } from "sql";
import { Model } from "../models";

/**
 * When reading a row from the database, such callback can be provided to transform the
 * row before passing it further upwards to the callers.
 * Can be used to convert DB types to JS types that need an explicit conversion, for
 * example, convert a string from the DB to BigNumber:
 * (row) => { row.amount = BigNumber.make(row.amount); return row; }
 * The transformation is done in-place and the function parameter is returned.
 */
export type TransformRowFromDb = (row) => any;

export abstract class Repository implements Database.IRepository {
    protected model: Model;

    constructor(protected readonly db, protected readonly pgp: IMain, private readonly options) {
        this.model = this.getModel();
    }

    public abstract getModel(): Model;

    public async truncate(): Promise<void> {
        await this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`);
    }

    public async insert(items: object | object[], db?: any): Promise<void> {
        db = db || this.db;
        return db.none(this.pgp.helpers.insert(items, this.model.getColumnSet()));
    }

    public async update(items: object | object[]): Promise<void> {
        await this.db.none(this.pgp.helpers.update(items, this.model.getColumnSet()));
    }

    protected get query(): any {
        return this.model.query();
    }

    protected propToColumnName(prop: string): string {
        if (prop) {
            const columnSet = this.model.getColumnSet();
            const columnDef = columnSet.columns.find(col => col.prop === prop || col.name === prop);

            return columnDef ? columnDef.name : undefined;
        }

        return prop;
    }

    protected async find<T = any>(query: Executable, transform?: TransformRowFromDb): Promise<T> {
        return this.db.oneOrNone(query.toQuery(), undefined, transform);
    }

    protected async findAny<T = any>(
        query: any /* Executable | QueryFile */,
        values?: any,
        transform?: TransformRowFromDb
    ): Promise<T> {
        if (query.toQuery) {
            /* query is of type Executable, convert to QueryFile. */
            query = query.toQuery();
        }
        // https://vitaly-t.github.io/pg-promise/Database.html#result
        return this.db.result(query, values, (result) => {
            if (transform !== undefined) {
                for (const row of result.rows) {
                    transform(row);
                }
            }
            return result.rows;
        });
    }

    protected async findAnyWithCount<T = any>(
        selectQuery: Query<any>,
        selectQueryCount: Query<any>,
        paginate?: Database.ISearchPaginate,
        orderBy?: Database.ISearchOrderBy[],
        transform?: TransformRowFromDb,
    ): Promise<{ rows: T; count: number; countIsEstimate: boolean }> {
        if (!!orderBy) {
            for (const o of orderBy) {
                const column = this.query.columns.find(column => column.prop.toLowerCase() === o.field);
                if (column) {
                    selectQuery.order(column[o.direction]);
                }
            }
        }

        if (!paginate || (!paginate.limit && !paginate.offset)) {
            // tslint:disable-next-line:no-shadowed-variable
            const rows = await this.findAny(selectQuery, undefined, transform);

            return { rows, count: rows.length, countIsEstimate: false };
        }

        selectQuery.offset(paginate.offset).limit(paginate.limit);

        const rows = await this.findAny(selectQuery, undefined, transform);

        if (rows.length < paginate.limit) {
            return { rows, count: paginate.offset + rows.length, countIsEstimate: false };
        }

        if (this.options.estimateTotalCount) {
            // Get the last rows=... from something that looks like (1 column, few rows):
            //
            //                            QUERY PLAN
            // ------------------------------------------------------------------
            //  Limit  (cost=15.34..15.59 rows=100 width=622)
            //    ->  Sort  (cost=15.34..15.64 rows=120 width=622)
            //          Sort Key: "timestamp" DESC
            //          ->  Seq Scan on transactions  (cost=0.00..11.20 rows=120 width=622)

            let count: number = 0;
            const explainedQuery = await this.db.manyOrNone(`EXPLAIN ${selectQuery.toString()}`);
            for (const row of explainedQuery) {
                const line: any = Object.values(row)[0];
                const match = line.match(/rows=([0-9]+)/);
                if (match) {
                    count = Number(match[1]);
                }
            }

            return { rows, count: Math.max(count, rows.length), countIsEstimate: true };
        }

        const countRow = await this.find(selectQueryCount);

        return { rows, count: Number(countRow.cnt), countIsEstimate: false };
    }
}
