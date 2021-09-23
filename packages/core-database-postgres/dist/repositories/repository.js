"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Repository {
    constructor(db, pgp, options) {
        this.db = db;
        this.pgp = pgp;
        this.options = options;
        this.model = this.getModel();
    }
    async truncate() {
        await this.db.none(`TRUNCATE ${this.model.getTable()} RESTART IDENTITY`);
    }
    async insert(items, db) {
        db = db || this.db;
        return db.none(this.pgp.helpers.insert(items, this.model.getColumnSet()));
    }
    async update(items) {
        await this.db.none(this.pgp.helpers.update(items, this.model.getColumnSet()));
    }
    get query() {
        return this.model.query();
    }
    propToColumnName(prop) {
        if (prop) {
            const columnSet = this.model.getColumnSet();
            const columnDef = columnSet.columns.find(col => col.prop === prop || col.name === prop);
            return columnDef ? columnDef.name : undefined;
        }
        return prop;
    }
    async find(query) {
        return this.db.oneOrNone(query.toQuery());
    }
    async findMany(query) {
        return this.db.manyOrNone(query.toQuery());
    }
    async findManyWithCount(selectQuery, selectQueryCount, paginate, orderBy) {
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
            const rows = await this.findMany(selectQuery);
            return { rows, count: rows.length, countIsEstimate: false };
        }
        selectQuery.offset(paginate.offset).limit(paginate.limit);
        const rows = await this.findMany(selectQuery);
        if (rows.length && rows.length < paginate.limit) {
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
            let count = 0;
            const explainedQuery = await this.db.manyOrNone(`EXPLAIN ${selectQuery.toString()}`);
            for (const row of explainedQuery) {
                const line = Object.values(row)[0];
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
exports.Repository = Repository;
//# sourceMappingURL=repository.js.map