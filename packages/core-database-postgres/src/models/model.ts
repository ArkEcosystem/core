import { Contracts } from "@arkecosystem/core-kernel";
import { ColumnSet, IMain } from "pg-promise";
import sql, { Query } from "sql";
import { ColumnDescriptor } from "../interfaces";

export abstract class Model implements Contracts.Database.Model {
    protected columnsDescriptor: ColumnDescriptor[];
    protected columnSet: ColumnSet;

    public constructor(protected readonly pgp: IMain) {}

    public abstract getTable(): string;

    public getColumnSet(): ColumnSet {
        if (!this.columnSet) {
            this.columnSet = this.createColumnSet(
                this.columnsDescriptor.map(col => {
                    const colDef: ColumnDescriptor = {
                        name: col.name,
                    };

                    for (const prop of ["prop", "init", "def"]) {
                        if (col.hasOwnProperty(prop)) {
                            colDef[prop] = col[prop];
                        }
                    }

                    return colDef;
                }),
            );
        }

        return this.columnSet;
    }

    public getSearchableFields(): Contracts.Database.SearchableField[] {
        return this.columnsDescriptor.map(col => ({
            fieldName: col.prop || col.name,
            supportedOperators: col.supportedOperators,
        }));
    }

    public getName(): string {
        return this.constructor.name;
    }

    public query<T = any>(): Query<T> {
        const { columns } = this.getColumnSet();

        return sql.define({
            name: this.getTable(),
            schema: "public",
            // @ts-ignore
            columns: columns.map(column => ({
                name: column.name,
                prop: column.prop || column.name,
            })),
        });
    }

    private createColumnSet(columns: ColumnDescriptor[]): ColumnSet {
        return new this.pgp.helpers.ColumnSet(columns, {
            table: {
                table: this.getTable(),
                schema: "public",
            },
        });
    }
}
