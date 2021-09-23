"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class QueryExecutor {
    constructor(connection) {
        this.connection = connection;
    }
    async none(query, parameters) {
        return this.connection.db.none(query, parameters);
    }
    async one(query, parameters) {
        return this.connection.db.one(query, parameters);
    }
    async oneOrNone(query, parameters) {
        return this.connection.db.oneOrNone(query, parameters);
    }
    async many(query, parameters) {
        return this.connection.db.many(query, parameters);
    }
    async manyOrNone(query, parameters) {
        return this.connection.db.manyOrNone(query, parameters);
    }
    async any(query, parameters) {
        return this.connection.db.any(query, parameters);
    }
}
exports.QueryExecutor = QueryExecutor;
//# sourceMappingURL=query-executor.js.map