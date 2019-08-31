import { TQuery } from "pg-promise";

import { PostgresConnection } from "../postgres-connection";

export class QueryExecutor {
    constructor(private readonly connection: PostgresConnection) {}

    public async none<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.none(query, parameters);
    }

    public async one<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.one(query, parameters);
    }

    public async oneOrNone<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.oneOrNone(query, parameters);
    }

    public async many<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.many(query, parameters);
    }

    public async manyOrNone<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.manyOrNone(query, parameters);
    }

    public async any<T = any>(query: TQuery, parameters?: any): Promise<T> {
        return this.connection.db.any(query, parameters);
    }
}
