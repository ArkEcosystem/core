import { PostgresConnection } from "../postgres-connection";

export class QueryExecutor {
    constructor(public connection: PostgresConnection) {}

    public async none(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "none");
    }

    public async one(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "one");
    }

    public async oneOrNone(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "oneOrNone");
    }

    public async many(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "many");
    }

    public async manyOrNone(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "manyOrNone");
    }

    public async any(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "any");
    }

    public async __executeQueryFile(query, parameters, method) {
        return this.connection.db[method](query, parameters);
    }
}
