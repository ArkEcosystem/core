import sql from "sql";

export abstract class Model {
    /**
     * Create a new model instance.
     * @param {Object} pgp
     */
    constructor(public pgp) {}

    /**
     * Get table name for model.
     * @return {String}
     */
    public abstract getTable(): string;

    /**
     * Get table column names for model.
     * @return {String[]}
     */
    public abstract getColumnSet(): any;

    /**
     * Return the model & table definition.
     * @return {Object}
     */
    public query(): any {
        const { schema, columns } = this.getColumnSet();
        return sql.define({
            name: this.getTable(),
            schema,
            columns: columns.map(column => ({
                name: column.name,
                prop: column.prop || column.name,
            })),
        });
    }

    /**
     * Convert the "camelCase" keys to "snake_case".
     * @return {ColumnSet}
     * @param columns
     */
    public createColumnSet(columns) {
        return new this.pgp.helpers.ColumnSet(columns, {
            table: {
                table: this.getTable(),
                schema: "public",
            },
        });
    }
}
