import { app, Contracts } from "@arkecosystem/core-kernel";
import { roundCalculator } from "@arkecosystem/core-utils";
import { constants, crypto, models } from "@arkecosystem/crypto";
import assert from "assert";
import cloneDeep from "lodash/cloneDeep";
import { DelegatesRepository } from "./repositories/delegates";
import { WalletsRepository } from "./repositories/wallets";
import { WalletManager } from "./wallet-manager";

const { Block } = models;
const { TransactionTypes } = constants;

export abstract class ConnectionInterface {
    // TODO: Convert these to protected/private and provide the appropriate get/setters
    public config = app.getConfig();
    public emitter = app.resolve<Contracts.EventEmitter.EventEmitter>("event-emitter");
    public blocksInCurrentRound: any[] = null;
    public stateStarted: boolean = false;
    public restoredDatabaseIntegrity: boolean = false;
    public walletManager: WalletManager = null;
    public forgingDelegates: any[] = null;
    public wallets: WalletsRepository = null;
    public delegates: DelegatesRepository = null;
    public queuedQueries: any[] = null;

    /**
     * @constructor
     * @param {Object} options
     */
    protected constructor(public readonly options: any) {
        this.__registerListeners();
    }

    public abstract async make(): Promise<ConnectionInterface>;

    /**
     * Connect to a database.
     * @return {void}
     * @throws Error
     */
    public abstract async connect(): Promise<void>;

    /**
     * Disconnect from a database.
     * @return {void}
     * @throws Error
     */
    public abstract async disconnect(): Promise<void>;

    /**
     * Verify the blockchain stored on db is not corrupted making simple assertions:
     * - Last block is available
     * - Last block height equals the number of stored blocks
     * - Number of stored transactions equals the sum of block.numberOfTransactions in the database
     * - Sum of all tx fees equals the sum of block.totalFee
     * - Sum of all tx amount equals the sum of block.totalAmount
     * @return {Object} An object { valid, errors } with the result of the verification and the errors
     */
    public abstract async verifyBlockchain(): Promise<any>;

    /**
     * Get the top 51 delegates.
     * @param  {Number} height
     * @param  {Array} delegates
     * @return {Array}
     * @throws Error
     */
    public abstract async getActiveDelegates(height, delegates?): Promise<any[]>;

    /**
     * Load a list of wallets into memory.
     * @param  {Number} height
     * @return {Boolean} success
     * @throws Error
     */
    public abstract async buildWallets(height): Promise<boolean>;

    /**
     * Commit wallets from the memory.
     * @param  {Boolean} force
     * @return {void}
     * @throws Error
     */
    public abstract async saveWallets(force): Promise<void>;

    /**
     * Commit the given block.
     * NOTE: to be used when node is in sync and committing newly received blocks
     * @param  {Block} block
     * @return {void}
     * @throws Error
     */
    public abstract async saveBlock(block): Promise<void>;

    /**
     * Queue a query to save the given block.
     * NOTE: Must call commitQueuedQueries() to save to database.
     * NOTE: to use when rebuilding to decrease the number of database transactions,
     * and commit blocks (save only every 1000s for instance) by calling commit
     * @param  {Block} block
     * @return {void}
     * @throws Error
     */
    public abstract enqueueSaveBlock(block): void;

    /**
     * Queue a query to delete the given block.
     * See also enqueueSaveBlock
     * @param  {Block} block
     * @return {void}
     * @throws Error
     */
    public abstract enqueueDeleteBlock(block): void;

    /**
     * Queue a query to delete the round at given height.
     * See also enqueueSaveBlock and enqueueDeleteBlock
     * @param  {Number} height
     * @return {void}
     * @throws Error
     */
    public abstract enqueueDeleteRound(height): void;

    /**
     * Commit all queued queries to the database.
     * NOTE: to be used in combination with other enqueue-functions.
     * @return {void}
     * @throws Error
     */
    public abstract async commitQueuedQueries(): Promise<void>;

    /**
     * Delete the given block.
     * @param  {Block} block
     * @return {void}
     * @throws Error
     */
    public abstract async deleteBlock(block): Promise<void>;

    /**
     * Get a block.
     * @param  {Block} id
     * @return {void}
     * @throws Error
     */
    public abstract async getBlock(id): Promise<any>;

    /**
     * Get last block.
     * @return {void}
     * @throws Error
     */
    public abstract async getLastBlock(): Promise<any>;

    /**
     * Get blocks for the given offset and limit.
     * @param  {Number} offset
     * @param  {Number} limit
     * @return {void}
     * @throws Error
     */
    public abstract async getBlocks(offset, limit): Promise<any[]>;

    /**
     * Get top count blocks ordered by height DESC.
     * NOTE: Only used when trying to restore database integrity.
     * The returned blocks may be unchained.
     * @param  {Number} count
     * @return {void}
     * @throws Error
     */
    public abstract async getTopBlocks(count): Promise<any[]>;

    /**
     * Get recent block ids.
     * @return {[]String}
     */
    public abstract async getRecentBlockIds(): Promise<string[]>;

    /**
     * Store the given round.
     * @param  {Array} activeDelegates
     * @return {void}
     * @throws Error
     */
    public abstract async saveRound(activeDelegates): Promise<void>;
    /**
     * Delete the given round.
     * @param  {Number} round
     * @return {void}
     * @throws Error
     */
    public abstract async deleteRound(round): Promise<void>;

    /**
     * Get a transaction.
     * @param  {Number} id
     * @return {Promise}
     */
    public abstract async getTransaction(id): Promise<any>;

    /**
     * Load blocks from current round into memory.
     * @return {void]}
     */
    public async loadBlocksFromCurrentRound() {
        this.blocksInCurrentRound = await this.__getBlocksForRound();
    }

    /**
     * Update delegate statistics in memory.
     * NOTE: must be called before saving new round of delegates
     * @param  {Block} block
     * @param  {Array} delegates
     * @return {void}
     */
    public updateDelegateStats(height, delegates) {
        if (!delegates || !this.blocksInCurrentRound) {
            return;
        }

        app.logger.debug("Updating delegate statistics");

        try {
            delegates.forEach(delegate => {
                const producedBlocks = this.blocksInCurrentRound.filter(
                    blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey,
                );
                const wallet = this.walletManager.findByPublicKey(delegate.publicKey);

                if (producedBlocks.length === 0) {
                    wallet.missedBlocks++;
                    app.logger.debug(
                        `Delegate ${wallet.username} (${wallet.publicKey}) just missed a block. Total: ${
                            wallet.missedBlocks
                        }`,
                    );
                    wallet.dirty = true;
                    this.emitter.emit("forger.missing", {
                        delegate: wallet,
                    });
                }
            });
        } catch (error) {
            app.logger.error(error.stack);
        }
    }

    /**
     * Apply the round.
     * Note that the round is applied and the end of the round (so checking height + 1)
     * so the next block to apply starting the new round will be ready to be validated
     * @param  {Number} height
     * @return {void}
     */
    public async applyRound(height) {
        const nextHeight = height === 1 ? 1 : height + 1;
        const maxDelegates = this.config.getMilestone(nextHeight).activeDelegates;

        if (nextHeight % maxDelegates === 1) {
            const round = Math.floor((nextHeight - 1) / maxDelegates) + 1;

            if (
                !this.forgingDelegates ||
                this.forgingDelegates.length === 0 ||
                (this.forgingDelegates.length && this.forgingDelegates[0].round !== round)
            ) {
                app.logger.info(`Starting Round ${round.toLocaleString()} :dove_of_peace:`);

                try {
                    this.updateDelegateStats(height, this.forgingDelegates);
                    this.saveWallets(false); // save only modified wallets during the last round
                    const delegates = this.walletManager.loadActiveDelegateList(maxDelegates, nextHeight); // get active delegate list from in-memory wallet manager
                    this.saveRound(delegates); // save next round delegate list non-blocking
                    this.forgingDelegates = await this.getActiveDelegates(nextHeight, delegates); // generate the new active delegates list
                    this.blocksInCurrentRound.length = 0;
                } catch (error) {
                    // trying to leave database state has it was
                    await this.deleteRound(round);
                    throw error;
                }
            } else {
                app.logger.warn(
                    // tslint:disable-next-line:max-line-length
                    `Round ${round.toLocaleString()} has already been applied. This should happen only if you are a forger. :warning:`,
                );
            }
        }
    }

    /**
     * Remove the round.
     * @param  {Number} height
     * @return {void}
     */
    public async revertRound(height) {
        const { round, nextRound, maxDelegates } = roundCalculator.calculateRound(height);

        if (nextRound === round + 1 && height >= maxDelegates) {
            app.logger.info(`Back to previous round: ${round.toLocaleString()} :back:`);

            const delegates = await this.__calcPreviousActiveDelegates(round);
            this.forgingDelegates = await this.getActiveDelegates(height, delegates);

            await this.deleteRound(nextRound);
        }
    }

    /**
     * Calculate the active delegates of the previous round. In order to do
     * so we need to go back to the start of that round. Therefore we create
     * a temporary wallet manager with all delegates and revert all blocks
     * and transactions of that round to get the initial vote balances
     * which are then used to restore the original order.
     * @param {Number} round
     */
    public async __calcPreviousActiveDelegates(round) {
        // TODO: cache the blocks of the last X rounds
        this.blocksInCurrentRound = await this.__getBlocksForRound(round);

        // Create temp wallet manager from all delegates
        const tempWalletManager = new WalletManager();
        tempWalletManager.index(cloneDeep(this.walletManager.allByUsername()));

        // Revert all blocks in reverse order
        let height = 0;
        for (let i = this.blocksInCurrentRound.length - 1; i >= 0; i--) {
            tempWalletManager.revertBlock(this.blocksInCurrentRound[i]);
            height = this.blocksInCurrentRound[i].data.height;
        }

        // The first round has no active delegates
        if (height === 1) {
            return [];
        }

        // Assert that the height is the beginning of a round.
        const { maxDelegates } = roundCalculator.calculateRound(height);
        assert(height > 1 && height % maxDelegates === 1);

        // Now retrieve the active delegate list from the temporary wallet manager.
        return tempWalletManager.loadActiveDelegateList(maxDelegates, height);
    }

    /**
     * Apply the given block.
     */
    public async applyBlock(block: any): Promise<boolean> {
        this.walletManager.applyBlock(block);

        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }

        await this.applyRound(block.data.height);
        block.transactions.forEach(tx => this.__emitTransactionEvents(tx));
        this.emitter.emit("block.applied", block.data);
        return true;
    }

    /**
     * Remove the given block.
     * @param  {Block} block
     * @return {void}
     */
    public async revertBlock(block) {
        await this.revertRound(block.data.height);
        await this.walletManager.revertBlock(block);

        assert(this.blocksInCurrentRound.pop().data.id === block.data.id);

        this.emitter.emit("block.reverted", block.data);
    }

    /**
     * Verify a transaction.
     * @param  {Transaction} transaction
     * @return {Boolean}
     */
    public async verifyTransaction(transaction) {
        const senderId = crypto.getAddress(transaction.data.senderPublicKey, this.config.get("network.pubKeyHash"));

        const sender = this.walletManager.findByAddress(senderId); // should exist

        if (!sender.publicKey) {
            sender.publicKey = transaction.data.senderPublicKey;
            this.walletManager.reindex(sender);
        }

        const dbTransaction = await this.getTransaction(transaction.data.id);

        return sender.canApply(transaction.data, []) && !dbTransaction;
    }

    /**
     * Get blocks for round.
     * @param  {number} round
     * @return {[]Block}
     */
    public async __getBlocksForRound(round?) {
        let lastBlock;
        if (app.has("state")) {
            lastBlock = app.resolve("state").getLastBlock();
        } else {
            lastBlock = await this.getLastBlock();
        }

        if (!lastBlock) {
            return [];
        }

        let height = +lastBlock.data.height;
        if (!round) {
            round = roundCalculator.calculateRound(height).round;
        }

        const maxDelegates = this.config.getMilestone(height).activeDelegates;
        height = round * maxDelegates + 1;

        const blocks = await this.getBlocks(height - maxDelegates, maxDelegates);
        return blocks.map(b => new Block(b));
    }

    /**
     * Register event listeners.
     * @return {void}
     */
    public __registerListeners() {
        this.emitter.on("state:started", () => {
            this.stateStarted = true;
        });
    }

    /**
     * Register the wallet app.
     * @return {void}
     */
    public _registerWalletManager() {
        this.walletManager = new WalletManager();
    }

    /**
     * Register the wallet and delegate repositories.
     * @return {void}
     */
    public _registerRepositories() {
        this.wallets = new WalletsRepository(this);
        this.delegates = new DelegatesRepository(this);
    }

    /**
     * Emit events for the specified transaction.
     * @param  {Object} transaction
     * @return {void}
     */
    private __emitTransactionEvents(transaction) {
        this.emitter.emit("transaction.applied", transaction.data);

        if (transaction.type === TransactionTypes.DelegateRegistration) {
            this.emitter.emit("delegate.registered", transaction.data);
        }

        if (transaction.type === TransactionTypes.DelegateResignation) {
            this.emitter.emit("delegate.resigned", transaction.data);
        }

        if (transaction.type === TransactionTypes.Vote) {
            const vote = transaction.asset.votes[0];

            this.emitter.emit(vote.startsWith("+") ? "wallet.vote" : "wallet.unvote", {
                delegate: vote,
                transaction: transaction.data,
            });
        }
    }
}
