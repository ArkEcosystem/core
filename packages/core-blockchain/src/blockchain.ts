/* tslint:disable:max-line-length */
import { app } from "@arkecosystem/core-container";
import {
    Blockchain as blockchain,
    Database,
    EventEmitter,
    Logger,
    P2P,
    TransactionPool,
} from "@arkecosystem/core-interfaces";
import { models, slots, Transaction } from "@arkecosystem/crypto";

import async from "async";
import delay from "delay";
import pluralize from "pluralize";
import { BlockProcessor, BlockProcessorResult } from "./processor";
import { stateMachine } from "./state-machine";
import { StateStorage } from "./state-storage";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const config = app.getConfig();
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const { Block } = models;

export class Blockchain implements blockchain.IBlockchain {
    /**
     * Get the state of the blockchain.
     * @return {IStateStorage}
     */
    get state(): StateStorage {
        return stateMachine.state;
    }

    /**
     * Get the network (p2p) interface.
     * @return {IPeerService}
     */
    get p2p(): P2P.IPeerService {
        return app.resolvePlugin<P2P.IPeerService>("p2p");
    }

    /**
     * Get the transaction handler.
     * @return {TransactionPool}
     */
    get transactionPool(): TransactionPool.IConnection {
        return app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
    }

    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    get database(): Database.IDatabaseService {
        return app.resolvePlugin<Database.IDatabaseService>("database");
    }

    public isStopped: boolean;
    public options: any;
    public queue: async.AsyncQueue<any>;
    private actions: any;
    private blockProcessor: BlockProcessor;

    /**
     * Create a new blockchain manager instance.
     * @param  {Object} options
     * @return {void}
     */
    constructor(options: { networkStart?: boolean }) {
        // flag to force a network start
        this.state.networkStart = !!options.networkStart;

        if (this.state.networkStart) {
            logger.warn(
                "Ark Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
            logger.info("Starting Ark Core for a new world, welcome aboard");
        }

        this.actions = stateMachine.actionMap(this);
        this.blockProcessor = new BlockProcessor(this);

        this.queue = async.queue((block: models.IBlockData, cb) => {
            try {
                return this.processBlock(new models.Block(block), cb);
            } catch (error) {
                logger.error(`Failed to process block in queue: ${block.height.toLocaleString()}`);
                logger.error(error.stack);
                return cb();
            }
        }, 1);

        this.queue.drain = () => this.dispatch("PROCESSFINISHED");
    }

    /**
     * Dispatch an event to transition the state machine.
     * @param  {String} event
     * @return {void}
     */
    public dispatch(event): void {
        const nextState = stateMachine.transition(this.state.blockchain, event);

        if (nextState.actions.length > 0) {
            logger.debug(
                `event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(
                    nextState.value,
                )} -> actions: [${nextState.actions.map(a => a.type).join(", ")}]`,
            );
        } else {
            logger.debug(
                `event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(
                    nextState.value,
                )}`,
            );
        }

        this.state.blockchain = nextState;

        nextState.actions.forEach(actionKey => {
            const action = this.actions[actionKey];

            if (action) {
                setTimeout(() => action.call(this, event), 0);
            } else {
                logger.error(`No action '${actionKey}' found`);
            }
        });

        return nextState;
    }

    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    public async start(skipStartedCheck = false): Promise<boolean> {
        logger.info("Starting Blockchain Manager :chains:");

        this.dispatch("START");

        emitter.once("shutdown", () => {
            this.stop();
        });

        if (skipStartedCheck || process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK) {
            return true;
        }

        // TODO: this state needs to be set after state.getLastBlock() is available if CORE_ENV=test
        while (!this.state.started && !this.isStopped) {
            await delay(1000);
        }

        return true;
    }

    public async stop(): Promise<void> {
        if (!this.isStopped) {
            logger.info("Stopping Blockchain Manager :chains:");

            this.isStopped = true;
            this.state.clearWakeUpTimeout();

            this.dispatch("STOP");

            this.queue.kill();
        }
    }

    /**
     * Set wakeup timeout to check the network for new blocks.
     */
    public setWakeUp(): void {
        this.state.wakeUpTimeout = setTimeout(() => {
            this.state.wakeUpTimeout = null;
            return this.dispatch("WAKEUP");
        }, 60000);
    }

    /**
     * Reset the wakeup timeout.
     */
    public resetWakeUp(): void {
        this.state.clearWakeUpTimeout();
        this.setWakeUp();
    }

    /**
     * Update network status.
     * @return {void}
     */
    public async updateNetworkStatus(): Promise<void> {
        await this.p2p.getMonitor().updateNetworkStatus();
    }

    /**
     * Reset the state of the blockchain.
     * @return {void}
     */
    public resetState(): void {
        this.clearAndStopQueue();
        this.state.reset();
    }

    /**
     * Clear and stop the queue.
     * @return {void}
     */
    public clearAndStopQueue(): void {
        this.state.lastDownloadedBlock = this.getLastBlock();

        this.queue.pause();
        this.clearQueue();
    }

    /**
     * Clear the queue.
     * @return {void}
     */
    public clearQueue(): void {
        this.queue.remove(() => true);
    }

    /**
     * Hand the given transactions to the transaction handler.
     */
    public async postTransactions(transactions: Transaction[]): Promise<void> {
        logger.info(`Received ${transactions.length} new ${pluralize("transaction", transactions.length)}`);

        await this.transactionPool.addTransactions(transactions);
    }

    /**
     * Push a block to the process queue.
     * @param  {Block} block
     * @return {void}
     */
    public handleIncomingBlock(block): void {
        logger.info(
            `Received new block at height ${block.height.toLocaleString()} with ${pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${block.ip}`,
        );

        const currentSlot = slots.getSlotNumber();
        const receivedSlot = slots.getSlotNumber(block.timestamp);
        if (receivedSlot > currentSlot) {
            logger.info(`Discarded block ${block.height.toLocaleString()} because it takes a future slot.`);
            return;
        }

        if (this.state.started) {
            this.dispatch("NEWBLOCK");
            this.enqueueBlocks([block]);

            emitter.emit("block.received", block);
        } else {
            logger.info(`Block disregarded because blockchain is not ready`);

            emitter.emit("block.disregarded", block);
        }
    }

    /**
     * Enqueue blocks in process queue and set last downloaded block to last item in list.
     */
    public enqueueBlocks(blocks: any[]): void {
        if (blocks.length === 0) {
            return;
        }

        this.queue.push(blocks);
        this.state.lastDownloadedBlock = new Block(blocks.slice(-1)[0]);
    }

    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    public async removeBlocks(nblocks: number): Promise<void> {
        this.clearAndStopQueue();

        // If the current chain height is H and we will be removing blocks [N, H],
        // then blocksToRemove[] will contain blocks [N - 1, H - 1].
        const blocksToRemove = await this.database.getBlocks(this.state.getLastBlock().data.height - nblocks, nblocks);

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
    public async removeTopBlocks(count: number): Promise<void> {
        const blocks = await this.database.getTopBlocks(count);

        logger.info(
            `Removing ${pluralize(
                "block",
                blocks.length,
                true,
            )} from height ${(blocks[0] as any).height.toLocaleString()}`,
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
     * Process the given block.
     */
    public async processBlock(block: models.Block, callback): Promise<any> {
        const result = await this.blockProcessor.process(block);

        if (result === BlockProcessorResult.Accepted || result === BlockProcessorResult.DiscardedButCanBeBroadcasted) {
            // broadcast only current block
            const blocktime = config.getMilestone(block.data.height).blocktime;
            if (this.state.started && slots.getSlotNumber() * blocktime <= block.data.timestamp) {
                this.p2p.getMonitor().broadcastBlock(block);
            }
        }

        return callback();
    }

    /**
     * Reset the last downloaded block to last chained block.
     */
    public resetLastDownloadedBlock(): void {
        this.state.lastDownloadedBlock = this.getLastBlock();
    }

    /**
     * Called by forger to wake up and sync with the network.
     * It clears the wakeUpTimeout if set.
     */
    public forceWakeup(): void {
        this.state.clearWakeUpTimeout();
        this.dispatch("WAKEUP");
    }

    /**
     * Fork the chain at the given block.
     */
    public forkBlock(block: models.Block, numberOfBlockToRollback?: number): void {
        this.state.forkedBlock = block;

        if (numberOfBlockToRollback) {
            this.state.numberOfBlocksToRollback = numberOfBlockToRollback;
        }

        this.dispatch("FORK");
    }

    /**
     * Get unconfirmed transactions for the specified block size.
     * @param  {Number}  blockSize
     * @param  {Boolean} forForging
     * @return {Object}
     */
    public getUnconfirmedTransactions(blockSize: number): { transactions: string[]; poolSize: number; count: number } {
        const transactions = this.transactionPool.getTransactionsForForging(blockSize);

        return {
            transactions,
            poolSize: this.transactionPool.getPoolSize(),
            count: transactions ? transactions.length : -1,
        };
    }

    /**
     * Determine if the blockchain is synced.
     */
    public isSynced(block?: models.IBlock): boolean {
        if (!this.p2p.getStorage().hasPeers()) {
            return true;
        }

        block = block || this.getLastBlock();

        return slots.getTime() - block.data.timestamp < 3 * config.getMilestone(block.data.height).blocktime;
    }

    /**
     * Get the last block of the blockchain.
     */
    public getLastBlock(): models.Block {
        return this.state.getLastBlock();
    }

    /**
     * Get the last height of the blockchain.
     */
    public getLastHeight(): number {
        return this.state.getLastBlock().data.height;
    }

    /**
     * Get the last downloaded block of the blockchain.
     */
    public getLastDownloadedBlock(): { data: models.IBlockData } {
        return this.state.lastDownloadedBlock;
    }

    /**
     * Get the block ping.
     */
    public getBlockPing(): number {
        return this.state.blockPing;
    }

    /**
     * Ping a block.
     */
    public pingBlock(incomingBlock: models.IBlockData): boolean {
        return this.state.pingBlock(incomingBlock);
    }

    /**
     * Push ping block.
     */
    public pushPingBlock(block: models.IBlockData): void {
        this.state.pushPingBlock(block);
    }
}
