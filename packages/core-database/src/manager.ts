import { Database } from "@arkecosystem/core-interfaces";

export class DatabaseManager {
    public connections: { [key: string]: Database.IConnection };

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
     * @return {DatabaseConnection}
     */
    public connection(name = "default"): Database.IConnection {
        return this.connections[name];
    }

    /**
     * Make the database connection instance.
     * @param  {DatabaseConnection} connection
     * @param  {String} name
     * @return {void}
     */
    public async makeConnection(connection: Database.IConnection, name = "default"): Promise<Database.IConnection> {
        this.connections[name] = await connection.make();
        return this.connection(name);
    }
}
