import { Database } from "@arkecosystem/core-interfaces";
import { IMain } from "pg-promise";
import { Model } from "../models";

export abstract class Repository implements Database.IRepository {
    protected model: Model;
    // @TODO: add proper return type
    protected query: any;

    constructor(protected readonly db, protected readonly pgp: IMain) {
        this.model = this.getModel();
        this.query = this.model.query();
    }

    public abstract getModel(): Model;

    public async truncate(): Promise<void> {
        return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`);
    }

    public async insert(items: object | object[]): Promise<void> {
        return this.db.none(this.pgp.helpers.insert(items, this.model.getColumnSet()));
    }

    public async update(items: object | object[]): Promise<void> {
        return this.db.none(this.pgp.helpers.update(items, this.model.getColumnSet()));
    }

    protected propToColumnName(prop: string): string {
        if (prop) {
            const columnSet = this.model.getColumnSet();
            const columnDef = columnSet.columns.find(col => col.prop === prop || col.name === prop);

            return columnDef ? columnDef.name : null;
        }

        return prop;
    }

    // @TODO: add query hint
    protected async find<T = any>(query): Promise<T> {
        return this.db.oneOrNone(query.toQuery());
    }

    // @TODO: add query hint
    protected async findMany<T = any>(query): Promise<T> {
        return this.db.manyOrNone(query.toQuery());
    }

    protected async findManyWithCount(
        selectQuery,
        paginate?: Database.SearchPaginate,
        orderBy?: Database.SearchOrderBy[],
    ): Promise<any> {
        if (!!orderBy) {
            orderBy.forEach(o => selectQuery.order(this.query[o.field][o.direction]));
        }

        if (!paginate || (!paginate.limit && !paginate.offset)) {
            // tslint:disable-next-line:no-shadowed-variable
            const rows = await this.findMany(selectQuery);

            return { rows, count: rows.length };
        }

        selectQuery.offset(paginate.offset).limit(paginate.limit);

        const rows = await this.findMany(selectQuery);

        if (rows.length < paginate.limit) {
            return { rows, count: paginate.limit + rows.length };
        }

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
            if (match !== null) {
                count = Number(match[1]);
            }
        }

        return { rows, count: Math.max(count, rows.length) };
    }
}
