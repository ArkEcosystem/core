export class DatabaseManager {
    public connections: { [key: string]: any };

    /**
     * Create a new database manager instance.
     * @constructor
     */
    constructor() {
        this.connections = {};
    }

    /**
     * Get a database connection instance.
     * @param  {String} name
     * @return {ConnectionInterface}
     */
    public connection(name = "default") {
        return this.connections[name];
    }

    /**
     * Make the database connection instance.
     * @param  {ConnectionInterface} connection
     * @param  {String} name
     * @return {void}
     */
    public async makeConnection(connection, name = "default") {
        this.connections[name] = await connection.make();
    }
}
