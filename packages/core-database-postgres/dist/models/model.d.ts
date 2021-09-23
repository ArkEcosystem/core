import { Database } from "@arkecosystem/core-interfaces";
import { ColumnSet, IMain } from "pg-promise";
import { Query } from "sql";
import { IColumnDescriptor } from "../interfaces";
export declare abstract class Model implements Database.IModel {
    protected readonly pgp: IMain;
    protected columnsDescriptor: IColumnDescriptor[];
    protected columnSet: ColumnSet;
    constructor(pgp: IMain);
    abstract getTable(): string;
    getColumnSet(): ColumnSet;
    getSearchableFields(): Database.ISearchableField[];
    getName(): string;
    query<T = any>(): Query<T>;
    private createColumnSet;
}
