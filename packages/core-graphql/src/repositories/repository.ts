import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { TransactionPool } from "@arkecosystem/core-interfaces";

export abstract class Repository {
    public database = app.resolvePlugin<PostgresConnection>("database");
    public transactionPool = app.resolvePlugin<TransactionPool.ITransactionPool>("transactionPool");
    public cache = this.database.getCache();
    public model = this.getModel();
    public query = this.model.query();

    public abstract getModel(): any;

    public async find(query) {
        return this.database.query.oneOrNone(query.toQuery());
    }

    public async findMany(query) {
        return this.database.query.manyOrNone(query.toQuery());
    }

    public async findManyWithCount(selectQuery, countQuery, { limit, offset, orderBy }) {
        const { count } = await this.find(countQuery);

        selectQuery
            .order(this.query[orderBy[0]][orderBy[1]])
            .offset(offset)
            .limit(limit);

        limit = 100;
        offset = 0;
        const rows = await this.findMany(selectQuery);
        return {
            rows,
            count: +count,
        };
    }

    private makeCountQuery() {
        return this.query.select("count(*) AS count").from(this.query);
    }

    private makeEstimateQuery() {
        return this.query.select("count(*) AS count").from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`);
    }

    private formatConditions(parameters) {
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
