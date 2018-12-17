import { app } from "@arkecosystem/core-container";
import { constants, crypto, models, slots } from "@arkecosystem/crypto";

import { roundCalculator } from "@arkecosystem/core-utils";
import assert from "assert";
import cloneDeep from "lodash/cloneDeep";
import { WalletManager } from "./wallet-manager";

import { DelegatesRepository } from "./repositories/delegates";
import { WalletsRepository } from "./repositories/wallets";

const { Block } = models;
const { TransactionTypes } = constants;

export abstract class ConnectionInterface {
    public config: any;
    public logger: any;
    public emitter: any;

    public connection: any;
    public blocksInCurrentRound: any[];
    public stateStarted: boolean;
    public restoredDatabaseIntegrity: boolean;
    public walletManager: WalletManager;
    public forgingDelegates: any[];
    public wallets: WalletsRepository;
    public delegates: DelegatesRepository;
    protected queuedQueries: any[];

    /**
     * @constructor
     * @param {Object} options
     */
    public constructor(public readonly options) {
        this.config = app.getConfig();
        this.logger = app.resolvePlugin("logger");
        this.emitter = app.resolvePlugin("event-emitter");

        this.connection = null;
        this.blocksInCurrentRound = null;
        this.stateStarted = false;
        this.restoredDatabaseIntegrity = false;
        this.walletManager = null;
        this.wallets = null;
        this.delegates = null;
        this.queuedQueries = null;

        this.__registerListeners();
    }

    /**
     * Get the current connection.
     * @return {ConnectionInterface}
     */
    public getConnection(): any {
        return this.connection;
    }

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

        this.logger.debug("Updating delegate statistics");

        try {
            delegates.forEach(delegate => {
                const producedBlocks = this.blocksInCurrentRound.filter(
                    blockGenerator => blockGenerator.data.generatorPublicKey === delegate.publicKey,
                );
                const wallet = this.walletManager.findByPublicKey(delegate.publicKey);

                if (producedBlocks.length === 0) {
                    wallet.missedBlocks++;
                    this.logger.debug(
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
            this.logger.error(error.stack);
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
                this.logger.info(`Starting Round ${round.toLocaleString()} :dove_of_peace:`);

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
                this.logger.warn(
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
            this.logger.info(`Back to previous round: ${round.toLocaleString()} :back:`);

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
     * Validate a delegate.
     * @param  {Block} block
     * @return {void}
     */
    public async validateDelegate(block) {
        const delegates = await this.getActiveDelegates(block.data.height);
        const slot = slots.getSlotNumber(block.data.timestamp);
        const forgingDelegate = delegates[slot % delegates.length];

        const generatorUsername = this.walletManager.findByPublicKey(block.data.generatorPublicKey).username;

        if (!forgingDelegate) {
            this.logger.debug(
                `Could not decide if delegate ${generatorUsername} (${
                    block.data.generatorPublicKey
                }) is allowed to forge block ${block.data.height.toLocaleString()} :grey_question:`,
            );
        } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
            const forgingUsername = this.walletManager.findByPublicKey(forgingDelegate.publicKey).username;

            throw new Error(
                `Delegate ${generatorUsername} (${
                    block.data.generatorPublicKey
                }) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey}) :-1:`,
            );
        } else {
            this.logger.debug(
                `Delegate ${generatorUsername} (${
                    block.data.generatorPublicKey
                }) allowed to forge block ${block.data.height.toLocaleString()} :+1:`,
            );
        }
    }

    /**
     * Validate a forked block.
     * @param  {Block} block
     * @return {Boolean}
     */
    public async validateForkedBlock(block) {
        try {
            await this.validateDelegate(block);
        } catch (error) {
            this.logger.debug(error.stack);
            return false;
        }

        return true;
    }

    /**
     * Apply the given block.
     * @param  {Block} block
     * @return {void}
     */
    public async applyBlock(block) {
        await this.validateDelegate(block);
        this.walletManager.applyBlock(block);

        if (this.blocksInCurrentRound) {
            this.blocksInCurrentRound.push(block);
        }

        await this.applyRound(block.data.height);
        block.transactions.forEach(tx => this.__emitTransactionEvents(tx));
        this.emitter.emit("block.applied", block.data);
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

        const blocks = await this.getBlocks(height - maxDelegates, maxDelegates - 1);
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
     * Determine if the given block is an exception.
     * @param  {Object} block
     * @return {Boolean}
     */
    public __isException(block) {
        if (!this.config) {
            return false;
        }

        if (!Array.isArray(this.config.get("exceptions.blocks"))) {
            return false;
        }

        return this.config.get("exceptions.blocks").includes(block.id);
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
