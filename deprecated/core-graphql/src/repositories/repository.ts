import { app } from "@arkecosystem/core-container";
import { Database, TransactionPool } from "@arkecosystem/core-interfaces";

export abstract class Repository {
    protected readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    protected readonly transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
    protected readonly cache = this.databaseService.cache;
    protected readonly model = this.getModel();
    protected readonly query = this.model.query();

    public abstract getModel(): Database.IModel;

    public async _find(query) {
        return (this.databaseService.connection as any).query.oneOrNone(query.toQuery());
    }

    public async _findMany(query) {
        return (this.databaseService.connection as any).query.manyOrNone(query.toQuery());
    }

    public async _findManyWithCount(selectQuery, countQuery, { limit, offset, orderBy }) {
        const { count } = await this._find(countQuery);

        selectQuery
            .order(this.query[orderBy[0]][orderBy[1]])
            .offset(offset)
            .limit(limit);

        limit = 100;
        offset = 0;
        const rows = await this._findMany(selectQuery);
        return {
            rows,
            count: +count,
        };
    }

    public _makeCountQuery() {
        return this.query.select("count(*) AS count").from(this.query);
    }

    public _makeEstimateQuery() {
        return this.query.select("count(*) AS count").from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`);
    }

    public _formatConditions(parameters) {
        const columns = this.model.getColumnSet().columns.map(column => ({
            name: column.name,
            prop: column.prop || column.name,
        }));

        const columnNames = columns.map(column => column.name);
        const columnProps = columns.map(column => column.prop);

        const filter = args => args.filter(arg => columnNames.includes(arg) || columnProps.includes(arg));

        return filter(Object.keys(parameters)).reduce((items, item) => {
            const columnName = columns.find(column => column.prop === item).name;

            items[columnName] = parameters[item];

            return items;
        }, {});
    }
}
