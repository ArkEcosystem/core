/* tslint:disable:max-line-length */
import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import {
    Blockchain as blockchain,
    Database,
    EventEmitter,
    Logger,
    P2P,
    State,
    TransactionPool,
} from "@arkecosystem/core-interfaces";
import { Blocks, Crypto, Interfaces, Managers, Utils } from "@arkecosystem/crypto";

import { isBlockChained, roundCalculator } from "@arkecosystem/core-utils";
import async from "async";
import delay from "delay";
import pluralize from "pluralize";
import { BlockProcessor, BlockProcessorResult } from "./processor";
import { stateMachine } from "./state-machine";

const logger = app.resolvePlugin<Logger.ILogger>("logger");
const config = app.getConfig();
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const { BlockFactory } = Blocks;

export class Blockchain implements blockchain.IBlockchain {
    /**
     * Get the state of the blockchain.
     * @return {IStateStore}
     */
    get state(): State.IStateStore {
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
    protected blockProcessor: BlockProcessor;
    private actions: any;
    private missedBlocks: number = 0;
    private lastCheckNetworkHealthTs: number = 0;

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
                "ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
            logger.info("Starting ARK Core for a new world, welcome aboard");
        }

        this.actions = stateMachine.actionMap(this);
        this.blockProcessor = new BlockProcessor(this);

        this.queue = async.queue((blockList: { blocks: Interfaces.IBlockData[] }, cb) => {
            try {
                return this.processBlocks(blockList.blocks, cb);
            } catch (error) {
                logger.error(
                    `Failed to process ${blockList.blocks.length} blocks from height ${blockList.blocks[0].height} in queue.`,
                );
                logger.error(error.stack);
                return cb();
            }
        }, 1);

        // @ts-ignore
        this.queue.drain(() => this.dispatch("PROCESSFINISHED"));
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

        for (const actionKey of nextState.actions) {
            const action = this.actions[actionKey];

            if (action) {
                setImmediate(() => action(event));
            } else {
                logger.error(`No action '${actionKey}' found`);
            }
        }

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

        while (!this.state.started && !this.isStopped) {
            await delay(1000);
        }

        this.p2p.getMonitor().cleansePeers({ forcePing: true, peerCount: 10 });

        emitter.on(ApplicationEvents.ForgerMissing, () => {
            this.checkMissingBlocks();
        });

        emitter.on(ApplicationEvents.RoundApplied, () => {
            this.missedBlocks = 0;
        });

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
            this.state.wakeUpTimeout = undefined;
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
     * Clear and stop the queue.
     * @return {void}
     */
    public clearAndStopQueue(): void {
        this.state.lastDownloadedBlock = this.getLastBlock().data;

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
     * Push a block to the process queue.
     */
    public handleIncomingBlock(block: Interfaces.IBlockData, fromForger: boolean = false): void {
        this.pushPingBlock(block, fromForger);

        const currentSlot: number = Crypto.Slots.getSlotNumber();
        const receivedSlot: number = Crypto.Slots.getSlotNumber(block.timestamp);

        if (fromForger) {
            const minimumMs: number = 2000;
            const timeLeftInMs: number = Crypto.Slots.getTimeInMsUntilNextSlot();
            if (currentSlot !== receivedSlot || timeLeftInMs < minimumMs) {
                logger.info(`Discarded block ${block.height.toLocaleString()} because it was received too late.`);
                return;
            }
        }

        if (receivedSlot > currentSlot) {
            logger.info(`Discarded block ${block.height.toLocaleString()} because it takes a future slot.`);
            return;
        }

        if (this.state.started) {
            this.dispatch("NEWBLOCK");
            this.enqueueBlocks([block]);

            emitter.emit(ApplicationEvents.BlockReceived, block);
        } else {
            logger.info(`Block disregarded because blockchain is not ready`);

            emitter.emit(ApplicationEvents.BlockDisregarded, block);
        }
    }

    /**
     * Enqueue blocks in process queue and set last downloaded block to last item in list.
     */
    public enqueueBlocks(blocks: Interfaces.IBlockData[]): void {
        if (blocks.length === 0) {
            return;
        }

        const lastDownloadedHeight: number = this.getLastDownloadedBlock().height;
        const milestoneHeights: number[] = Managers.configManager
            .getMilestones()
            .map(milestone => milestone.height)
            .sort((a, b) => a - b)
            .filter(height => height >= lastDownloadedHeight);

        // divide blocks received into chunks depending on number of transactions
        // this is to avoid blocking the application when processing "heavy" blocks
        let currentBlocksChunk = [];
        let currentTransactionsCount = 0;
        for (const block of blocks) {
            currentBlocksChunk.push(block);
            currentTransactionsCount += block.numberOfTransactions;

            const nextMilestone = milestoneHeights[0] && milestoneHeights[0] === block.height;
            if (currentTransactionsCount >= 150 || currentBlocksChunk.length > 100 || nextMilestone) {
                this.queue.push({ blocks: currentBlocksChunk });
                currentBlocksChunk = [];
                currentTransactionsCount = 0;
                if (nextMilestone) {
                    milestoneHeights.shift();
                }
            }
        }
        this.queue.push({ blocks: currentBlocksChunk });

        this.state.lastDownloadedBlock = blocks.slice(-1)[0];
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
        const blocksToRemove: Interfaces.IBlockData[] = await this.database.getBlocks(
            this.state.getLastBlock().data.height - nblocks,
            nblocks,
        );

        const removedBlocks: Interfaces.IBlockData[] = [];
        const removedTransactions: Interfaces.ITransaction[] = [];

        const revertLastBlock = async () => {
            // tslint:disable-next-line:no-shadowed-variable
            const lastBlock: Interfaces.IBlock = this.state.getLastBlock();

            await this.database.revertBlock(lastBlock);
            removedBlocks.push(lastBlock.data);
            removedTransactions.push(...[...lastBlock.transactions].reverse());

            let newLastBlock: Interfaces.IBlock;
            if (blocksToRemove[blocksToRemove.length - 1].height === 1) {
                newLastBlock = app
                    .resolvePlugin<State.IStateService>("state")
                    .getStore()
                    .getGenesisBlock();
            } else {
                newLastBlock = BlockFactory.fromData(blocksToRemove.pop(), { deserializeTransactionsUnchecked: true });
            }

            this.state.setLastBlock(newLastBlock);
            this.state.lastDownloadedBlock = newLastBlock.data;
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

        const lastBlock: Interfaces.IBlock = this.state.getLastBlock();

        if (nblocks >= lastBlock.data.height) {
            nblocks = lastBlock.data.height - 1;
        }

        const resetHeight: number = lastBlock.data.height - nblocks;
        logger.info(`Removing ${pluralize("block", nblocks, true)}. Reset to height ${resetHeight.toLocaleString()}`);

        this.state.lastDownloadedBlock = lastBlock.data;

        await __removeBlocks(nblocks);

        await this.database.deleteBlocks(removedBlocks);

        if (this.transactionPool) {
            await this.transactionPool.replay(removedTransactions.reverse());
        }
    }

    /**
     * Remove the top blocks from database.
     * NOTE: Only used when trying to restore database integrity.
     * @param  {Number} count
     * @return {void}
     */
    public async removeTopBlocks(count: number): Promise<void> {
        const blocks: Interfaces.IBlockData[] = await this.database.getTopBlocks(count);

        logger.info(
            `Removing ${pluralize(
                "block",
                blocks.length,
                true,
            )} from height ${(blocks[0] as any).height.toLocaleString()}`,
        );

        try {
            await this.database.deleteBlocks(blocks);
            await this.database.loadBlocksFromCurrentRound();
        } catch (error) {
            logger.error(`Encountered error while removing blocks: ${error.message}`);
        }
    }

    /**
     * Process the given block.
     */
    public async processBlocks(blocks: Interfaces.IBlockData[], callback): Promise<Interfaces.IBlock[]> {
        const acceptedBlocks: Interfaces.IBlock[] = [];
        let lastProcessResult: BlockProcessorResult;

        if (
            blocks[0] &&
            !isBlockChained(this.getLastBlock().data, blocks[0], logger) &&
            !Utils.isException(blocks[0])
        ) {
            // Discard remaining blocks as it won't go anywhere anyway.
            this.clearQueue();
            this.resetLastDownloadedBlock();
            return callback();
        }

        let forkBlock: Interfaces.IBlock;
        let lastProcessedBlock: Interfaces.IBlock;
        for (const block of blocks) {
            const blockInstance = Blocks.BlockFactory.fromData(block);
            lastProcessResult = await this.blockProcessor.process(blockInstance);
            lastProcessedBlock = blockInstance;

            if (lastProcessResult === BlockProcessorResult.Accepted) {
                acceptedBlocks.push(blockInstance);
            } else {
                if (lastProcessResult === BlockProcessorResult.Rollback) {
                    forkBlock = blockInstance;
                }

                break; // if one block is not accepted, the other ones won't be chained anyway
            }
        }

        if (acceptedBlocks.length > 0) {
            try {
                await this.database.saveBlocks(acceptedBlocks);
            } catch (error) {
                logger.error(`Could not save ${acceptedBlocks.length} blocks to database : ${error.stack}`);

                this.clearQueue();

                // Rounds are saved while blocks are being processed and may now be out of sync with the last
                // block that was written into the database.

                const lastBlock: Interfaces.IBlock = await this.database.getLastBlock();
                const lastHeight: number = lastBlock.data.height;
                const deleteRoundsAfter: number = roundCalculator.calculateRound(lastHeight).round;

                logger.info(
                    `Reverting ${pluralize("block", acceptedBlocks.length, true)} back to last height: ${lastHeight}`,
                );

                for (const block of acceptedBlocks.reverse()) {
                    await this.database.walletManager.revertBlock(block);
                }

                this.state.setLastBlock(lastBlock);
                this.resetLastDownloadedBlock();

                await this.database.deleteRound(deleteRoundsAfter + 1);
                await this.database.loadBlocksFromCurrentRound();

                return callback();
            }
        }

        if (
            lastProcessResult === BlockProcessorResult.Accepted ||
            lastProcessResult === BlockProcessorResult.DiscardedButCanBeBroadcasted
        ) {
            // broadcast last processed block
            const blocktime: number = config.getMilestone(lastProcessedBlock.data.height).blocktime;

            if (this.state.started && Crypto.Slots.getSlotNumber() * blocktime <= lastProcessedBlock.data.timestamp) {
                this.p2p.getMonitor().broadcastBlock(lastProcessedBlock);
            }
        } else if (forkBlock) {
            this.forkBlock(forkBlock);
        }

        return callback(acceptedBlocks);
    }

    /**
     * Reset the last downloaded block to last chained block.
     */
    public resetLastDownloadedBlock(): void {
        this.state.lastDownloadedBlock = this.getLastBlock().data;
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
    public forkBlock(block: Interfaces.IBlock, numberOfBlockToRollback?: number): void {
        this.state.forkedBlock = block;

        this.clearAndStopQueue();

        if (numberOfBlockToRollback) {
            this.state.numberOfBlocksToRollback = numberOfBlockToRollback;
        }

        this.dispatch("FORK");
    }

    /**
     * Determine if the blockchain is synced.
     */
    public isSynced(block?: Interfaces.IBlockData): boolean {
        if (!this.p2p.getStorage().hasPeers()) {
            return true;
        }

        block = block || this.getLastBlock().data;

        return Crypto.Slots.getTime() - block.timestamp < 3 * config.getMilestone(block.height).blocktime;
    }

    public async replay(targetHeight?: number): Promise<void> {
        return;
    }

    /**
     * Get the last block of the blockchain.
     */
    public getLastBlock(): Interfaces.IBlock {
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
    public getLastDownloadedBlock(): Interfaces.IBlockData {
        return this.state.lastDownloadedBlock || this.getLastBlock().data;
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
    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        return this.state.pingBlock(incomingBlock);
    }

    /**
     * Push ping block.
     */
    public pushPingBlock(block: Interfaces.IBlockData, fromForger: boolean = false): void {
        this.state.pushPingBlock(block, fromForger);
    }

    /**
     * Check if the blockchain should roll back due to missing blocks.
     */
    public async checkMissingBlocks(): Promise<void> {
        this.missedBlocks++;
        if (
            this.missedBlocks >= Managers.configManager.getMilestone().activeDelegates / 3 - 1 &&
            Math.random() <= 0.8
        ) {
            this.missedBlocks = 0;

            // do not check network health here more than every 10 minutes
            const nowTs = Date.now();
            if (nowTs - this.lastCheckNetworkHealthTs < 10 * 60 * 1000) {
                return;
            }
            this.lastCheckNetworkHealthTs = nowTs;

            const networkStatus = await this.p2p.getMonitor().checkNetworkHealth();
            if (networkStatus.forked) {
                this.state.numberOfBlocksToRollback = networkStatus.blocksToRollback;
                this.dispatch("FORK");
            }
        }
    }
}
