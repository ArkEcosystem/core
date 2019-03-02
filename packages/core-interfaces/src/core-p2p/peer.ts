import { models, Transaction } from "@arkecosystem/crypto";

export interface IPeer {
    setHeaders(headers: any): void;

    /**
     * Set the given status for the peer.
     * @param  {String} value
     * @return {void}
     */
    setStatus(value: any): void;

    /**
     * Get information to broadcast.
     * @return {Object}
     */
    toBroadcastInfo(): {
        ip: any;
        port: number;
        nethash: any;
        version: any;
        os: any;
        status: any;
        height: any;
        delay: any;
    };

    /**
     * Perform POST request for a block.
     * @param  {Block}              block
     * @return {(Object|undefined)}
     */
    postBlock(block: models.Block): Promise<any>;

    /**
     * Perform POST request for a transactions.
     * @param  {Transaction[]}      transactions
     * @return {(Object|undefined)}
     */
    postTransactions(transactions: Transaction[]): Promise<any>;

    /**
     * Download blocks from peer.
     * @param  {Number} fromBlockHeight
     * @return {(Object[]|undefined)}
     */
    downloadBlocks(fromBlockHeight: number): Promise<any>;

    /**
     * Perform ping request on this peer if it has not been
     * recently pinged.
     * @param  {Number} delay operation timeout, in milliseconds
     * @param  {Boolean} force
     * @return {Object}
     * @throws {Error} If fail to get peer status.
     */
    ping(delay: number, force?: boolean): Promise<any>;

    /**
     * Returns true if this peer was pinged the past 2 minutes.
     * @return {Boolean}
     */
    recentlyPinged(): boolean;

    /**
     * Refresh peer list. It removes blacklisted peers from the fetch
     * @return {Object[]}
     */
    getPeers(): Promise<any>;

    /**
     * Check if peer has common blocks.
     * @param  {[]String} ids
     * @return {Boolean}
     */
    hasCommonBlocks(ids: string[]): Promise<any>;

    /**
     * GET /peer/blocks and return the raw response.
     * The API is such that the response is supposed to contain blocks at height
     * afterBlockHeight + 1, afterBlockHeight + 2, and so on up to some limit determined by the peer.
     * @param  {Number} afterBlockHeight
     * @return {(Object[]|undefined)}
     */
    getPeerBlocks(afterBlockHeight: number): Promise<any>;
}
