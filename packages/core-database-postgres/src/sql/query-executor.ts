import { PostgresConnection } from "../postgres-connection";

export class QueryExecutor {
    /**
     * Create a new QueryExecutor instance.
     * @param  {[type]} connection
     * @return {QueryBuilder}
     */
    constructor(public connection: PostgresConnection) {}

    /**
     * Execute the given query and expect no results.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async none(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "none");
    }

    /**
     * Execute the given query and expect one result.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async one(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "one");
    }

    /**
     * Execute the given query and expect one or no results.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async oneOrNone(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "oneOrNone");
    }

    /**
     * Execute the given query and expect many results.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async many(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "many");
    }

    /**
     * Execute the given query and expect many or no results.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async manyOrNone(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "manyOrNone");
    }

    /**
     * Execute the given query and expect any results.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @return {Promise}
     */
    public async any(query, parameters = null) {
        return this.__executeQueryFile(query, parameters, "any");
    }

    /**
     * Execute the given query using the given method and parameters.
     * @param  {QueryFile} query
     * @param  {Array} parameters
     * @param  {String} method
     * @return {QueryBuilder}
     */
    public async __executeQueryFile(query, parameters, method) {
        return this.connection.db[method](query, parameters);
    }
}
