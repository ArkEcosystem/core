import { Database } from "@arkecosystem/core-interfaces";
import { IMain } from "pg-promise";
import { Executable, Query } from "sql";
import { Model } from "../models";
export declare abstract class Repository implements Database.IRepository {
    protected readonly db: any;
    protected readonly pgp: IMain;
    private readonly options;
    protected model: Model;
    constructor(db: any, pgp: IMain, options: any);
    abstract getModel(): Model;
    truncate(): Promise<void>;
    insert(items: object | object[], db?: any): Promise<void>;
    update(items: object | object[]): Promise<void>;
    protected get query(): any;
    protected propToColumnName(prop: string): string;
    protected find<T = any>(query: Executable): Promise<T>;
    protected findMany<T = any>(query: Executable): Promise<T>;
    protected findManyWithCount<T = any>(selectQuery: Query<any>, selectQueryCount: Query<any>, paginate?: Database.ISearchPaginate, orderBy?: Database.ISearchOrderBy[]): Promise<{
        rows: T;
        count: number;
        countIsEstimate: boolean;
    }>;
}
