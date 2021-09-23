import { TQuery } from "pg-promise";
import { PostgresConnection } from "../postgres-connection";
export declare class QueryExecutor {
    private readonly connection;
    constructor(connection: PostgresConnection);
    none<T = any>(query: TQuery, parameters?: any): Promise<T>;
    one<T = any>(query: TQuery, parameters?: any): Promise<T>;
    oneOrNone<T = any>(query: TQuery, parameters?: any): Promise<T>;
    many<T = any>(query: TQuery, parameters?: any): Promise<T>;
    manyOrNone<T = any>(query: TQuery, parameters?: any): Promise<T>;
    any<T = any>(query: TQuery, parameters?: any): Promise<T>;
}
