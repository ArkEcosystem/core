export interface INetworkStatus {
    forked: boolean;
    blocksToRollback?: number;
}

export interface IMonitor {
    peers: { [ip: string]: any };

    start(options: any): Promise<this>;

    /**
     * Update network status (currently only peers are updated).
     * @param  {Boolean} networkStart
     * @return {Promise}
     */
    updateNetworkStatus(networkStart?: boolean): Promise<void>;

    /**
     * Accept and store a valid peer.
     * @param  {IPeer} peer
     * @throws {Error} If invalid peer
     */
    acceptNewPeer(peer: any): Promise<void>;

    /**
     * Remove peer from monitor.
     * @param {IPeer} peer
     */
    removePeer(peer: any): void;

    /**
     * Clear peers which aren't responding.
     * @param {Boolean} fast
     * @param {Boolean} tracker
     * @param {Boolean} forcePing
     */
    cleanPeers(fast?: boolean, forcePing?: boolean): Promise<void>;

    /**
     * Suspend an existing peer.
     * @param  {IPeer} peer
     * @return {void}
     */
    suspendPeer(ip: any): void;

    /**
     * Get a list of all suspended peers.
     * @return {void}
     */
    getSuspendedPeers(): { [ip: string]: any };

    /**
     * Get all available peers.
     * @return {IPeer[]}
     */
    getPeers(): any[];

    /**
     * Get the peer available peers.
     * @param  {String} ip
     * @return {IPeer}
     */
    getPeer(ip: any): any;

    peerHasCommonBlocks(peer: any, blockIds: any): Promise<boolean>;

    /**
     * Get a random, available peer.
     * @param  {(Number|undefined)} acceptableDelay
     * @return {IPeer}
     */
    getRandomPeer(acceptableDelay?: any, downloadSize?: any, failedAttempts?: any): any;

    /**
     * Populate list of available peers from random peers.
     */
    discoverPeers(): Promise<void>;

    /**
     * Check if we have any peers.
     * @return {bool}
     */
    hasPeers(): boolean;

    /**
     * Get the median network height.
     * @return {Number}
     */
    getNetworkHeight(): any;

    /**
     * Get the PBFT Forging status.
     * @return {Number}
     */
    getPBFTForgingStatus(): number;

    /**
     * Refresh all peers after a fork. Peers with no common blocks are
     * suspended.
     * @return {void}
     */
    refreshPeersAfterFork(): Promise<void>;

    /**
     * Download blocks from a random peer.
     * @param  {Number}   fromBlockHeight
     * @return {Object[]}
     */
    downloadBlocks(fromBlockHeight: any): any;

    /**
     * Broadcast block to all peers.
     * @param  {Block}   block
     * @return {Promise}
     */
    broadcastBlock(block: any): Promise<void>;

    /**
     * Broadcast transactions to a fixed number of random peers.
     * @param {Transaction[]} transactions
     */
    broadcastTransactions(transactions: any): Promise<any[]>;

    /**
     * Check if too many peers are forked and rollback if necessary.
     * Returns the number of blocks to rollback if any.
     * @return {Promise<INetworkStatus>}
     */
    checkNetworkHealth(): Promise<INetworkStatus>;

    /**
     * Dump the list of active peers.
     * @return {void}
     */
    dumpPeers(): void;
}
