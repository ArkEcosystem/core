import { Database } from "@arkecosystem/core-interfaces";
import { Model } from "../models";

export abstract class Repository implements Database.IRepository {
    protected model: Model;
    protected q;

    /**
     * Create a new repository instance.
     * @param  {Object} db
     * @param  {Object} pgp
     */
    constructor(public db, public pgp) {
        this.model = this.getModel();
        this.q = this.model.query();
    }

    /**
     * Get the model related to this repository.
     * @return {Model}
     */
    public abstract getModel(): Model;

    /**
     * Estimate the number of records in the table.
     * @return {Promise}
     */
    public async estimate() {
        return this.db.one(`SELECT count_estimate('SELECT * FROM ${this.model.getTable()})`);
    }

    /**
     * Run a truncate statement on the table.
     * @return {Promise}
     */
    public async truncate() {
        return this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`);
    }

    /**
     * Create one or many instances of the related models.
     * @param  {Array|Object} items
     * @return {Promise}
     */
    public async insert(items) {
        return this.db.none(this.insertQuery(items));
    }

    /**
     * Update one or many instances of the related models.
     * @param  {Array|Object} items
     * @return {Promise}
     */
    public async update(items) {
        return this.db.none(this.updateQuery(items));
    }

    /**
     * Generate an "INSERT" query for the given data.
     * @param  {Array|Object} data
     * @return {String}
     */
    protected insertQuery(data) {
        return this.pgp.helpers.insert(data, this.model.getColumnSet());
    }

    /**
     * Generate an "UPDATE" query for the given data.
     * @param  {Array|Object} data
     * @return {String}
     */
    protected updateQuery(data) {
        return this.pgp.helpers.update(data, this.model.getColumnSet());
    }

    protected propToColumnName(prop: string): string {
        if(prop) {
            const columnSet = this.model.getColumnSet();
            const columnDef = columnSet.columns.find(col => col.prop === prop || col.name === prop);
            return columnDef ? columnDef.name : null;
        }
        return prop;
    }

    protected async find(query): Promise<any> {
        return this.db.oneOrNone(query.toQuery());
    }

    protected async findMany(query): Promise<any> {
        return this.db.manyOrNone(query.toQuery());
    }

    protected async findManyWithCount(selectQuery, paginate?: Database.SearchPaginate, orderBy?: Database.SearchOrderBy[]): Promise<any> {

        if (!!orderBy) {
            orderBy.forEach(o => selectQuery.order(this.q[o.field][o.direction]));
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

        let count = 0;
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
