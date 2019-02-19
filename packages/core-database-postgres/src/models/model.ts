import { Database } from "@arkecosystem/core-interfaces";
import sql from "sql";

interface ColumnDescriptor {
    name: string,
    supportedOperators?: Database.SearchOperator[],
    prop?: string,
    init?: any,
    def?: any
}

export abstract class Model implements Database.IDatabaseModel {

    protected columnsDescriptor: ColumnDescriptor[];
    protected columnSet: any;

    /**
     * Create a new model instance.
     * @param {Object} pgp
     */
    protected constructor(public pgp) {
    }

    /**
     * Get table name for model.
     * @return {String}
     */
    public abstract getTable(): string;

    /**
     * Get table column names for model.
     * @return {String[]}
     */
    public getColumnSet() {
        if (!this.columnSet) {
            this.columnSet = this.createColumnSet(this.columnsDescriptor.map(col => {
                const colDef: any = {
                    name: col.name
                };
                ["prop", "init", "def"].forEach(prop => {
                    if (col.hasOwnProperty(prop)) {
                        colDef[prop] = col[prop];
                    }
                });
                return colDef;
            }));
        }
        return this.columnSet;
    }

    public getSearchableFields(): Database.SearchableField[] {
        return this.columnsDescriptor.map(col => {
            return {
                fieldName: col.prop || col.name,
                supportedOperators: col.supportedOperators
            }
        });
    }

    public getName(): string {
        return this.constructor.name;
    }

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
    private createColumnSet(columns) {
        return new this.pgp.helpers.ColumnSet(columns, {
            table: {
                table: this.getTable(),
                schema: "public",
            },
        });
    }
}
