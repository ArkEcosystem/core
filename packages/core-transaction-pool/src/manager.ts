class TransactionPoolManager {
    private connections: { [key: string]: any };

    /**
     * Create a new transaction pool manager instance.
     * @constructor
     */
    constructor() {
        this.connections = {};
    }

    /**
     * Get a transaction pool instance.
     * @param  {String} name
     * @return {TransactionPoolInterface}
     */
    public connection(name = "default") {
        return this.connections[name];
    }

    /**
     * Make the transaction pool instance.
     * @param  {TransactionPoolInterface} connection
     * @param  {String} name
     * @return {void}
     */
    public async makeConnection(connection, name = "default") {
        this.connections[name] = await connection.make();
    }
}

export const transactionPoolManager = new TransactionPoolManager();
