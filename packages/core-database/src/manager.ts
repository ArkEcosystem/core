import { ConnectionInterface } from "./interface";

export class DatabaseManager {
    public connections: { [key: string]: ConnectionInterface };

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
    public connection(name = "default"): ConnectionInterface {
        return this.connections[name];
    }

    /**
     * Make the database connection instance.
     * @param  {ConnectionInterface} connection
     * @param  {String} name
     * @return {void}
     */
    public async makeConnection(connection: ConnectionInterface, name = "default"): Promise<ConnectionInterface> {
        this.connections[name] = await connection.make();
        return this.connection(name);
    }
}
