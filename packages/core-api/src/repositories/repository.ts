import { app } from "@arkecosystem/core-container";
import snakeCase from "lodash/snakeCase";

export class Repository {
    public database: any;
    public cache: any;
    public model: any;
    public query: any;
    public columns: string[] = [];

    public constructor() {
        this.database = app.resolvePlugin("database");
        this.cache = this.database.getCache();
        // @ts-ignore
        this.model = this.getModel();
        this.query = this.model.query();

        this.__mapColumns();
    }

    public async _find(query): Promise<any> {
        return this.database.query.oneOrNone(query.toQuery());
    }

    public async _findMany(query): Promise<any> {
        return this.database.query.manyOrNone(query.toQuery());
    }

    public async _findManyWithCount(selectQuery, countQuery, { limit, offset, orderBy }): Promise<any> {
        const { count } = await this._find(countQuery);

        if (this.columns.includes(orderBy[0])) {
            selectQuery.order(this.query[snakeCase(orderBy[0])][orderBy[1]]);
        }

        selectQuery.offset(offset).limit(limit);

        return {
            rows: await this._findMany(selectQuery),
            count: +count,
        };
    }

    public _makeCountQuery(): Promise<any> {
        return this.query.select("count(*) AS count").from(this.query);
    }

    public _makeEstimateQuery(): Promise<any> {
        return this.query.select("count(*) AS count").from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`);
    }

    public _formatConditions(parameters): any {
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

    public __mapColumns(): void {
        this.columns = [];

        for (const column of this.model.getColumnSet().columns) {
            this.columns.push(column.name);

            if (column.prop) {
                this.columns.push(column.prop);
            }
        }
    }
}
