import { Database } from "@arkecosystem/core-interfaces";

export class DatabaseManager {
    public connections: { [key: string]: Database.IDatabaseConnection };

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
    public connection(name = "default"): Database.IDatabaseConnection {
        return this.connections[name];
    }

    /**
     * Make the database connection instance.
     * @param  {DatabaseConnection} connection
     * @param  {String} name
     * @return {void}
     */
    public async makeConnection(
        connection: Database.IDatabaseConnection,
        name = "default",
    ): Promise<Database.IDatabaseConnection> {
        this.connections[name] = await connection.make();
        return this.connection(name);
    }
}
