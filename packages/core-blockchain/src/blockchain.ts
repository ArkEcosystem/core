/* tslint:disable:max-line-length */
import { app } from "@arkecosystem/core-container";
import { models, slots } from "@arkecosystem/crypto";

import delay from "delay";
import pluralize from "pluralize";
import { ProcessQueue, Queue, RebuildQueue } from "./queue";
import { stateMachine } from "./state-machine";

const logger = app.resolvePlugin("logger");
const config = app.resolvePlugin("config");
const emitter = app.resolvePlugin("event-emitter");
const { Block } = models;

export class Blockchain {
    public isStopped: boolean;
    public options: any;
    public processQueue: ProcessQueue;
    public rebuildQueue: RebuildQueue;
    private actions: any;
    private queue: Queue;

    /**
     * Create a new blockchain manager instance.
     * @param  {Object} options
     * @return {void}
     */
    constructor(options) {
        // flag to force a network start
        this.state.networkStart = !!options.networkStart;

        if (this.state.networkStart) {
            logger.warn(
                "Ark Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong. :warning:",
            );
            logger.info("Starting Ark Core for a new world, welcome aboard :rocket:");
        }

        this.actions = stateMachine.actionMap(this);

        this.__registerQueue();
    }

    /**
     * Dispatch an event to transition the state machine.
     * @param  {String} event
     * @return {void}
     */
    public dispatch(event) {
        const nextState = stateMachine.transition(this.state.blockchain, event);

        if (nextState.actions.length > 0) {
            logger.debug(
                `event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(
                    nextState.value,
                )} -> actions: [${nextState.actions.map(a => a.type).join(", ")}]`,
            );
        }

        this.state.blockchain = nextState;

        nextState.actions.forEach(actionKey => {
            const action = this.actions[actionKey];

            if (action) {
                setTimeout(() => action.call(this, event), 0);
            } else {
                logger.error(`No action '${actionKey}' found :interrobang:`);
            }
        });

        return nextState;
    }

    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    public async start(skipStartedCheck = false) {
        logger.info("Starting Blockchain Manager :chains:");

        this.dispatch("START");

        emitter.once("shutdown", () => {
            this.stop();
        });

        if (skipStartedCheck || process.env.ARK_SKIP_BLOCKCHAIN_STARTED_CHECK) {
            return true;
        }

        // TODO: this state needs to be set after state.getLastBlock() is available if ARK_ENV=test
        while (!this.state.started && !this.isStopped) {
            await delay(1000);
        }

        return true;
    }

    public async stop() {
        if (!this.isStopped) {
            logger.info("Stopping Blockchain Manager :chains:");

            this.isStopped = true;
            this.state.clearCheckLater();

            this.dispatch("STOP");

            this.queue.destroy();
        }
    }

    public checkNetwork() {
        throw new Error("Method [checkNetwork] not implemented!");
    }

    /**
     * Update network status.
     * @return {void}
     */
    public async updateNetworkStatus() {
        return this.p2p.updateNetworkStatus();
    }

    /**
     * Rebuild N blocks in the blockchain.
     * @param  {Number} nblocks
     * @return {void}
     */
    public rebuild(nblocks) {
        throw new Error("Method [rebuild] not implemented!");
    }

    /**
     * Reset the state of the blockchain.
     * @return {void}
     */
    public resetState() {
        this.clearAndStopQueue();
        this.state.reset();
    }

    /**
     * Clear and stop the queue.
     * @return {void}
     */
    public clearAndStopQueue() {
        this.queue.pause();
        this.queue.clear();
    }

    /**
     * Hand the given transactions to the transaction handler.
     * @param  {Array}   transactions
     * @return {void}
     */
    public async postTransactions(transactions) {
        logger.info(`Received ${transactions.length} new ${pluralize("transaction", transactions.length)} :moneybag:`);

        await this.transactionPool.addTransactions(transactions);
    }

    /**
     * Push a block to the process queue.
     * @param  {Block} block
     * @return {void}
     */
    public queueBlock(block) {
        logger.info(
            `Received new block at height ${block.height.toLocaleString()} with ${pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${block.ip}`,
        );

        if (this.state.started && this.state.blockchain.value === "idle") {
            this.dispatch("NEWBLOCK");

            this.processQueue.push(block);
            this.state.lastDownloadedBlock = new Block(block);
        } else {
            logger.info(`Block disregarded because blockchain is not ready :exclamation:`);
        }
    }

    /**
     * Rollback all blocks up to the previous round.
     * @return {void}
     */
    public async rollbackCurrentRound() {
        const height = this.state.getLastBlock().data.height;
        const maxDelegates = config.getConstants(height).activeDelegates;
        const previousRound = Math.floor((height - 1) / maxDelegates);

        if (previousRound < 2) {
            return;
        }

        const newHeight = previousRound * maxDelegates;
        const blocksToRemove = await this.database.getBlocks(newHeight, height - newHeight - 1);
        const deleteLastBlock = async () => {
            const lastBlock = this.state.getLastBlock();
            await this.database.enqueueDeleteBlock(lastBlock);

            const newLastBlock = new Block(blocksToRemove.pop());

            this.state.setLastBlock(newLastBlock);
            this.state.lastDownloadedBlock = newLastBlock;
        };

        logger.info(`Removing ${pluralize("block", height - newHeight, true)} to reset current round :warning:`);

        let count = 0;
        const max = this.state.getLastBlock().data.height - newHeight;

        while (this.state.getLastBlock().data.height >= newHeight + 1) {
            const removalBlockId = this.state.getLastBlock().data.id;
            const removalBlockHeight = this.state.getLastBlock().data.height.toLocaleString();
            logger.printTracker("Removing block", count++, max, `ID: ${removalBlockId}, height: ${removalBlockHeight}`);

            await deleteLastBlock();
        }

        // Commit delete blocks
        await this.database.commitQueuedQueries();

        logger.stopTracker(`${pluralize("block", max, true)} removed`, count, max);

        await this.database.deleteRound(previousRound + 1);
    }

    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    public async removeBlocks(nblocks) {
        this.clearAndStopQueue();

        const blocksToRemove = await this.database.getBlocks(
            this.state.getLastBlock().data.height - nblocks,
            nblocks - 1,
        );

        const revertLastBlock = async () => {
            // tslint:disable-next-line:no-shadowed-variable
            const lastBlock = this.state.getLastBlock();

            // TODO: if revertBlock Failed, it might corrupt the database because one block could be left stored
            await this.database.revertBlock(lastBlock);
            this.database.enqueueDeleteBlock(lastBlock);

            if (this.transactionPool) {
                await this.transactionPool.addTransactions(lastBlock.transactions);
            }

            const newLastBlock = new Block(blocksToRemove.pop());

            this.state.setLastBlock(newLastBlock);
            this.state.lastDownloadedBlock = newLastBlock;
        };

        // tslint:disable-next-line:variable-name
        const __removeBlocks = async numberOfBlocks => {
            if (numberOfBlocks < 1) {
                return;
            }

            logger.info(`Undoing block ${this.state.getLastBlock().data.height.toLocaleString()}`);

            await revertLastBlock();
            await __removeBlocks(numberOfBlocks - 1);
        };

        const lastBlock = this.state.getLastBlock();
        if (nblocks >= lastBlock.data.height) {
            nblocks = lastBlock.data.height - 1;
        }

        const resetHeight = lastBlock.data.height - nblocks;
        logger.info(`Removing ${pluralize("block", nblocks, true)}. Reset to height ${resetHeight.toLocaleString()}`);

        this.state.lastDownloadedBlock = lastBlock;

        await __removeBlocks(nblocks);

        // Commit delete blocks
        await this.database.commitQueuedQueries();

        this.queue.resume();
    }

    /**
     * Remove the top blocks from database.
     * NOTE: Only used when trying to restore database integrity.
     * @param  {Number} count
     * @return {void}
     */
    public async removeTopBlocks(count) {
        const blocks = await this.database.getTopBlocks(count);

        logger.info(
            `Removing ${pluralize("block", blocks.length, true)} from height ${blocks[0].height.toLocaleString()}`,
        );

        for (let block of blocks) {
            block = new Block(block);

            this.database.enqueueDeleteRound(block.data.height);
            this.database.enqueueDeleteBlock(block);
        }

        await this.database.commitQueuedQueries();
        await this.database.loadBlocksFromCurrentRound();
    }

    /**
     * Hande a block during a rebuild.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block} block
     * @param  {Function} callback
     * @return {Object}
     */
    public async rebuildBlock(block, callback) {
        const lastBlock = this.state.getLastBlock();

        if (block.verification.verified) {
            if (this.__isChained(lastBlock, block)) {
                // save block on database
                this.database.enqueueSaveBlock(block);

                // committing to db every 20,000 blocks
                if (block.data.height % 20000 === 0) {
                    await this.database.commitQueuedQueries();
                }

                this.state.setLastBlock(block);

                return callback();
            }
            if (block.data.height > lastBlock.data.height + 1) {
                this.state.lastDownloadedBlock = lastBlock;
                return callback();
            }
            if (
                block.data.height < lastBlock.data.height ||
                (block.data.height === lastBlock.data.height && block.data.id === lastBlock.data.id)
            ) {
                this.state.lastDownloadedBlock = lastBlock;
                return callback();
            }
            this.state.lastDownloadedBlock = lastBlock;
            logger.info(`Block ${block.data.height.toLocaleString()} disregarded because on a fork :knife_fork_plate:`);
            return callback();
        }
        logger.warn(`Block ${block.data.height.toLocaleString()} disregarded because verification failed :scroll:`);
        logger.warn(JSON.stringify(block.verification, null, 4));
        return callback();
    }

    /**
     * Process the given block.
     * NOTE: We should be sure this is fail safe (ie callback() is being called only ONCE)
     * @param  {Block} block
     * @param  {Function} callback
     * @return {(Function|void)}
     */
    public async processBlock(block, callback) {
        if (!block.verification.verified && !this.database.__isException(block.data)) {
            logger.warn(`Block ${block.data.height.toLocaleString()} disregarded because verification failed :scroll:`);
            logger.warn(JSON.stringify(block.verification, null, 4));

            this.transactionPool.purgeSendersWithInvalidTransactions(block);
            this.state.lastDownloadedBlock = this.state.getLastBlock();
            return callback();
        }

        try {
            if (this.__isChained(this.state.getLastBlock(), block)) {
                await this.acceptChainedBlock(block);
            } else {
                await this.manageUnchainedBlock(block);
            }
        } catch (error) {
            logger.error(`Refused new block ${JSON.stringify(block.data)}`);
            logger.debug(error.stack);

            this.transactionPool.purgeBlock(block);
            this.forkBlock(block);

            return callback();
        }

        try {
            // broadcast only current block
            const blocktime = config.getConstants(block.data.height).blocktime;
            if (slots.getSlotNumber() * blocktime <= block.data.timestamp) {
                this.p2p.broadcastBlock(block);
            }
        } catch (error) {
            logger.warn(`Can't properly broadcast block ${block.data.height.toLocaleString()}`);
            logger.debug(error.stack);
        }

        return callback();
    }

    /**
     * Accept a new chained block.
     * @param  {Block} block
     * @param  {Object} state
     * @return {void}
     */
    public async acceptChainedBlock(block) {
        const containsForgedTransactions = await this.checkBlockContainsForgedTransactions(block);
        if (containsForgedTransactions) {
            this.state.lastDownloadedBlock = this.state.getLastBlock();
            return;
        }

        await this.database.applyBlock(block);
        await this.database.saveBlock(block);

        // Check if we recovered from a fork
        if (this.state.forkedBlock && this.state.forkedBlock.height === block.data.height) {
            logger.info("Successfully recovered from fork :star2:");
            this.state.forkedBlock = null;
        }

        if (this.transactionPool) {
            try {
                this.transactionPool.acceptChainedBlock(block);
            } catch (error) {
                logger.warn("Issue applying block to transaction pool");
                logger.debug(error.stack);
            }
        }

        this.state.setLastBlock(block);

        // Ensure the lastDownloadedBlock is not behind the last accepted block.
        if (this.state.lastDownloadedBlock && this.state.lastDownloadedBlock.data.height < block.data.height) {
            this.state.lastDownloadedBlock = block;
        }
    }

    /**
     * Manage a block that is out of order.
     * @param  {Block} block
     * @param  {Object} state
     * @return {void}
     */
    public async manageUnchainedBlock(block) {
        const lastBlock = this.state.getLastBlock();

        if (block.data.height > lastBlock.data.height + 1) {
            logger.debug(
                `Blockchain not ready to accept new block at height ${block.data.height.toLocaleString()}. Last block: ${lastBlock.data.height.toLocaleString()} :warning:`,
            );

            // Also remove all remaining queued blocks. Since blocks are downloaded in batches,
            // it is very likely that all blocks will be disregarded at this point anyway.
            // NOTE: This isn't really elegant, but still better than spamming the log with
            //       useless `not ready to accept` messages.
            if (this.processQueue.length() > 0) {
                logger.debug(`Discarded ${this.processQueue.length()} downloaded blocks.`);
            }
            this.queue.clear();

            this.state.lastDownloadedBlock = lastBlock;
        } else if (block.data.height < lastBlock.data.height) {
            logger.debug(
                `Block ${block.data.height.toLocaleString()} disregarded because already in blockchain :warning:`,
            );
        } else if (block.data.height === lastBlock.data.height && block.data.id === lastBlock.data.id) {
            logger.debug(`Block ${block.data.height.toLocaleString()} just received :chains:`);
        } else {
            const isValid = await this.database.validateForkedBlock(block);

            if (isValid) {
                this.forkBlock(block);
            } else {
                logger.info(
                    `Forked block disregarded because it is not allowed to forge. Caused by delegate: ${
                        block.data.generatorPublicKey
                    } :bangbang:`,
                );
            }
        }
    }

    /**
     * Checks if the given block contains already forged transactions.
     * @param {Block} block
     * @returns {Boolean}
     */
    public async checkBlockContainsForgedTransactions(block) {
        // Discard block if it contains already forged transactions
        if (block.transactions.length > 0) {
            const forgedIds = await this.database.getForgedTransactionsIds(block.transactions.map(tx => tx.id));
            if (forgedIds.length > 0) {
                logger.warn(
                    `Block ${block.data.height.toLocaleString()} disregarded, because it contains already forged transactions :scroll:`,
                );
                logger.debug(`${JSON.stringify(forgedIds, null, 4)}`);
                return true;
            }
        }

        return false;
    }

    /**
     * Called by forger to wake up and sync with the network.
     * It clears the checkLaterTimeout if set.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    public forceWakeup() {
        this.state.clearCheckLater();
        this.dispatch("WAKEUP");
    }

    /**
     * Fork the chain at the given block.
     * @param {Block} block
     * @returns {void}
     */
    public forkBlock(block) {
        this.state.forkedBlock = block;

        this.dispatch("FORK");
    }

    /**
     * Get unconfirmed transactions for the specified block size.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    public getUnconfirmedTransactions(blockSize) {
        const transactions = this.transactionPool.getTransactionsForForging(blockSize);

        return {
            transactions,
            poolSize: this.transactionPool.getPoolSize(),
            count: transactions ? transactions.length : -1,
        };
    }

    /**
     * Determine if the blockchain is synced.
     * @param  {Block} [block=getLastBlock()]  block
     * @return {Boolean}
     */
    public isSynced(block?) {
        if (!this.p2p.hasPeers()) {
            return true;
        }

        block = block || this.getLastBlock();

        return slots.getTime() - block.data.timestamp < 3 * config.getConstants(block.data.height).blocktime;
    }

    /**
     * Determine if the blockchain is synced after a rebuild.
     * @param  {Block}  block
     * @return {Boolean}
     */
    public isRebuildSynced(block?) {
        if (!this.p2p.hasPeers()) {
            return true;
        }

        block = block || this.getLastBlock();

        const remaining = slots.getTime() - block.data.timestamp;
        logger.info(`Remaining block timestamp ${remaining} :hourglass:`);

        // stop fast rebuild 7 days before the last network block
        return slots.getTime() - block.data.timestamp < 3600 * 24 * 7;
        // return slots.getTime() - block.data.timestamp < 100 * config.getConstants(block.data.height).blocktime
    }

    /**
     * Get the last block of the blockchain.
     * @return {Object}
     */
    public getLastBlock(): any {
        return this.state.getLastBlock();
    }

    /**
     * Get the last height of the blockchain.
     * @return {Object}
     */
    public getLastHeight() {
        return this.state.getLastBlock().data.height;
    }

    /**
     * Get the last downloaded block of the blockchain.
     * @return {Object}
     */
    public getLastDownloadedBlock() {
        return this.state.lastDownloadedBlock;
    }

    /**
     * Get the block ping.
     * @return {Object}
     */
    public getBlockPing() {
        return this.state.blockPing;
    }

    /**
     * Ping a block.
     * @return {Object}
     */
    public pingBlock(incomingBlock) {
        return this.state.pingBlock(incomingBlock);
    }

    /**
     * Push ping block.
     * @return {Object}
     */
    public pushPingBlock(block) {
        this.state.pushPingBlock(block);
    }

    /**
     * Get the list of events that are available.
     * @return {Array}
     */
    public getEvents() {
        return [
            "block.applied",
            "block.forged",
            "block.reverted",
            "delegate.registered",
            "delegate.resigned",
            "forger.failed",
            "forger.missing",
            "forger.started",
            "peer.added",
            "peer.removed",
            "round.created",
            "state:started",
            "transaction.applied",
            "transaction.expired",
            "transaction.forged",
            "transaction.reverted",
            "wallet.saved",
            "wallet.created.cold",
        ];
    }

    /**
     * Get the state of the blockchain.
     * @return {StateStorage}
     */
    get state() {
        return stateMachine.state;
    }

    /**
     * Get the network (p2p) interface.
     * @return {P2PInterface}
     */
    get p2p() {
        return app.resolvePlugin("p2p");
    }

    /**
     * Get the transaction handler.
     * @return {TransactionPool}
     */
    get transactionPool() {
        return app.resolvePlugin("transactionPool");
    }

    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    get database() {
        return app.resolvePlugin("database");
    }

    /**
     * Check if the given block is in order.
     * @param  {Block}  previousBlock
     * @param  {Block}  nextBlock
     * @return {Boolean}
     */
    public __isChained(previousBlock, nextBlock) {
        const followsPrevious = nextBlock.data.previousBlock === previousBlock.data.id;
        const isFuture = nextBlock.data.timestamp > previousBlock.data.timestamp;
        const isPlusOne = nextBlock.data.height === previousBlock.data.height + 1;

        return followsPrevious && isFuture && isPlusOne;
    }

    /**
     * Register the block queue.
     * @return {void}
     */
    public __registerQueue() {
        this.queue = new Queue(this, {
            process: "PROCESSFINISHED",
            rebuild: "REBUILDFINISHED",
        });

        this.processQueue = this.queue.process;
        this.rebuildQueue = this.queue.rebuild;
    }
}
