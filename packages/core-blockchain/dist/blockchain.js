"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable:max-line-length */
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const crypto_1 = require("@arkecosystem/crypto");
const core_utils_1 = require("@arkecosystem/core-utils");
const async_1 = __importDefault(require("async"));
const delay_1 = __importDefault(require("delay"));
const pluralize_1 = __importDefault(require("pluralize"));
const processor_1 = require("./processor");
const state_machine_1 = require("./state-machine");
const logger = core_container_1.app.resolvePlugin("logger");
const config = core_container_1.app.getConfig();
const emitter = core_container_1.app.resolvePlugin("event-emitter");
const { BlockFactory } = crypto_1.Blocks;
class Blockchain {
    /**
     * Create a new blockchain manager instance.
     * @param  {Object} options
     * @return {void}
     */
    constructor(options) {
        this.missedBlocks = 0;
        this.lastCheckNetworkHealthTs = 0;
        // flag to force a network start
        this.state.networkStart = !!options.networkStart;
        if (this.state.networkStart) {
            logger.warn("ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.");
            logger.info("Starting ARK Core for a new world, welcome aboard");
        }
        this.actions = state_machine_1.stateMachine.actionMap(this);
        this.blockProcessor = new processor_1.BlockProcessor(this);
        this.queue = async_1.default.queue(async (blockList) => {
            try {
                return await this.processBlocks(blockList.blocks);
            }
            catch (error) {
                logger.error(`Failed to process ${blockList.blocks.length} blocks from height ${blockList.blocks[0].height} in queue.`);
                return undefined;
            }
        }, 1);
        // @ts-ignore
        this.queue.drain(() => this.dispatch("PROCESSFINISHED"));
    }
    /**
     * Get the state of the blockchain.
     * @return {IStateStore}
     */
    get state() {
        return state_machine_1.stateMachine.state;
    }
    /**
     * Get the network (p2p) interface.
     * @return {IPeerService}
     */
    get p2p() {
        return core_container_1.app.resolvePlugin("p2p");
    }
    /**
     * Get the transaction handler.
     * @return {TransactionPool}
     */
    get transactionPool() {
        return core_container_1.app.resolvePlugin("transaction-pool");
    }
    /**
     * Get the database connection.
     * @return {ConnectionInterface}
     */
    get database() {
        return core_container_1.app.resolvePlugin("database");
    }
    /**
     * Dispatch an event to transition the state machine.
     * @param  {String} event
     * @return {void}
     */
    dispatch(event) {
        const nextState = state_machine_1.stateMachine.transition(this.state.blockchain, event);
        if (nextState.actions.length > 0) {
            logger.debug(`event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(nextState.value)} -> actions: [${nextState.actions.map(a => a.type).join(", ")}]`);
        }
        else {
            logger.debug(`event '${event}': ${JSON.stringify(this.state.blockchain.value)} -> ${JSON.stringify(nextState.value)}`);
        }
        this.state.blockchain = nextState;
        for (const actionKey of nextState.actions) {
            const action = this.actions[actionKey];
            if (action) {
                setImmediate(() => action(event));
            }
            else {
                logger.error(`No action '${actionKey}' found`);
            }
        }
        return nextState;
    }
    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    async start(skipStartedCheck = false) {
        logger.info("Starting Blockchain Manager :chains:");
        this.dispatch("START");
        emitter.once("shutdown", () => {
            this.stop();
        });
        if (skipStartedCheck || process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK) {
            return true;
        }
        while (!this.state.started && !this.isStopped) {
            await delay_1.default(1000);
        }
        this.p2p.getMonitor().cleansePeers({ forcePing: true, peerCount: 10 });
        emitter.on(core_event_emitter_1.ApplicationEvents.ForgerMissing, () => {
            this.checkMissingBlocks();
        });
        emitter.on(core_event_emitter_1.ApplicationEvents.RoundApplied, () => {
            this.missedBlocks = 0;
        });
        return true;
    }
    async stop() {
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
    setWakeUp() {
        this.state.wakeUpTimeout = setTimeout(() => {
            this.state.wakeUpTimeout = undefined;
            return this.dispatch("WAKEUP");
        }, 60000);
    }
    /**
     * Reset the wakeup timeout.
     */
    resetWakeUp() {
        this.state.clearWakeUpTimeout();
        this.setWakeUp();
    }
    /**
     * Update network status.
     * @return {void}
     */
    async updateNetworkStatus() {
        await this.p2p.getMonitor().updateNetworkStatus();
    }
    /**
     * Clear and stop the queue.
     * @return {void}
     */
    clearAndStopQueue() {
        this.state.lastDownloadedBlock = this.getLastBlock().data;
        this.queue.pause();
        this.clearQueue();
    }
    /**
     * Clear the queue.
     * @return {void}
     */
    clearQueue() {
        this.queue.remove(() => true);
    }
    /**
     * Push a block to the process queue.
     */
    handleIncomingBlock(block, fromForger = false) {
        this.pushPingBlock(block, fromForger);
        const currentSlot = crypto_1.Crypto.Slots.getSlotNumber();
        const receivedSlot = crypto_1.Crypto.Slots.getSlotNumber(block.timestamp);
        if (fromForger) {
            const minimumMs = 2000;
            const timeLeftInMs = crypto_1.Crypto.Slots.getTimeInMsUntilNextSlot();
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
            emitter.emit(core_event_emitter_1.ApplicationEvents.BlockReceived, block);
        }
        else {
            logger.info(`Block disregarded because blockchain is not ready`);
            emitter.emit(core_event_emitter_1.ApplicationEvents.BlockDisregarded, block);
        }
    }
    /**
     * Enqueue blocks in process queue and set last downloaded block to last item in list.
     */
    enqueueBlocks(blocks) {
        if (blocks.length === 0) {
            return;
        }
        const lastDownloadedHeight = this.getLastDownloadedBlock().height;
        const milestoneHeights = crypto_1.Managers.configManager
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
    }
    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    async removeBlocks(nblocks) {
        this.clearAndStopQueue();
        // If the current chain height is H and we will be removing blocks [N, H],
        // then blocksToRemove[] will contain blocks [N - 1, H - 1].
        const blocksToRemove = await this.database.getBlocks(this.state.getLastBlock().data.height - nblocks, nblocks);
        const removedBlocks = [];
        const removedTransactions = [];
        const revertLastBlock = async () => {
            // tslint:disable-next-line:no-shadowed-variable
            const lastBlock = this.state.getLastBlock();
            await this.database.revertBlock(lastBlock);
            removedBlocks.push(lastBlock.data);
            removedTransactions.push(...[...lastBlock.transactions].reverse());
            let newLastBlock;
            if (blocksToRemove[blocksToRemove.length - 1].height === 1) {
                newLastBlock = core_container_1.app
                    .resolvePlugin("state")
                    .getStore()
                    .getGenesisBlock();
            }
            else {
                newLastBlock = BlockFactory.fromData(blocksToRemove.pop(), { deserializeTransactionsUnchecked: true });
            }
            this.state.setLastBlock(newLastBlock);
            this.state.lastDownloadedBlock = newLastBlock.data;
        };
        // tslint:disable-next-line:variable-name
        const __removeBlocks = async (numberOfBlocks) => {
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
        logger.info(`Removing ${pluralize_1.default("block", nblocks, true)}. Reset to height ${resetHeight.toLocaleString()}`);
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
    async removeTopBlocks(count) {
        const blocks = await this.database.getTopBlocks(count);
        logger.info(`Removing ${pluralize_1.default("block", blocks.length, true)} from height ${blocks[0].height.toLocaleString()}`);
        try {
            await this.database.deleteBlocks(blocks);
            await this.database.loadBlocksFromCurrentRound();
        }
        catch (error) {
            logger.error(`Encountered error while removing blocks: ${error.message}`);
        }
    }
    /**
     * Process the given block.
     */
    async processBlocks(blocks) {
        const acceptedBlocks = [];
        let lastProcessResult;
        if (blocks[0] &&
            !core_utils_1.isBlockChained(this.getLastBlock().data, blocks[0], logger) &&
            !crypto_1.Utils.isException(blocks[0])) {
            // Discard remaining blocks as it won't go anywhere anyway.
            this.clearQueue();
            this.resetLastDownloadedBlock();
            return undefined;
        }
        let forkBlock;
        let lastProcessedBlock;
        for (const block of blocks) {
            const blockInstance = crypto_1.Blocks.BlockFactory.fromData(block);
            lastProcessResult = await this.blockProcessor.process(blockInstance);
            lastProcessedBlock = blockInstance;
            if (lastProcessResult === processor_1.BlockProcessorResult.Accepted) {
                acceptedBlocks.push(blockInstance);
                this.state.lastDownloadedBlock = blockInstance.data;
            }
            else {
                if (lastProcessResult === processor_1.BlockProcessorResult.Rollback) {
                    forkBlock = blockInstance;
                    this.state.lastDownloadedBlock = blockInstance.data;
                }
                break; // if one block is not accepted, the other ones won't be chained anyway
            }
        }
        if (acceptedBlocks.length > 0) {
            try {
                await this.database.saveBlocks(acceptedBlocks);
            }
            catch (error) {
                logger.error(`Could not save ${acceptedBlocks.length} blocks to database : ${error.stack}`);
                this.clearQueue();
                // Rounds are saved while blocks are being processed and may now be out of sync with the last
                // block that was written into the database.
                const lastBlock = await this.database.getLastBlock();
                const lastHeight = lastBlock.data.height;
                const deleteRoundsAfter = core_utils_1.roundCalculator.calculateRound(lastHeight).round;
                logger.info(`Reverting ${pluralize_1.default("block", acceptedBlocks.length, true)} back to last height: ${lastHeight}`);
                for (const block of acceptedBlocks.reverse()) {
                    await this.database.walletManager.revertBlock(block);
                }
                this.state.setLastBlock(lastBlock);
                this.resetLastDownloadedBlock();
                await this.database.deleteRound(deleteRoundsAfter + 1);
                await this.database.loadBlocksFromCurrentRound();
                return undefined;
            }
        }
        if (lastProcessResult === processor_1.BlockProcessorResult.Accepted ||
            lastProcessResult === processor_1.BlockProcessorResult.DiscardedButCanBeBroadcasted) {
            // broadcast last processed block
            const blocktime = config.getMilestone(lastProcessedBlock.data.height).blocktime;
            if (this.state.started && crypto_1.Crypto.Slots.getSlotNumber() * blocktime <= lastProcessedBlock.data.timestamp) {
                this.p2p.getMonitor().broadcastBlock(lastProcessedBlock);
            }
        }
        else if (forkBlock) {
            this.forkBlock(forkBlock);
        }
        return acceptedBlocks;
    }
    /**
     * Reset the last downloaded block to last chained block.
     */
    resetLastDownloadedBlock() {
        this.state.lastDownloadedBlock = this.getLastBlock().data;
    }
    /**
     * Called by forger to wake up and sync with the network.
     * It clears the wakeUpTimeout if set.
     */
    forceWakeup() {
        this.state.clearWakeUpTimeout();
        this.dispatch("WAKEUP");
    }
    /**
     * Fork the chain at the given block.
     */
    forkBlock(block, numberOfBlockToRollback) {
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
    isSynced(block) {
        if (!this.p2p.getStorage().hasPeers()) {
            return true;
        }
        block = block || this.getLastBlock().data;
        return crypto_1.Crypto.Slots.getTime() - block.timestamp < 3 * config.getMilestone(block.height).blocktime;
    }
    async replay(targetHeight) {
        return;
    }
    /**
     * Get the last block of the blockchain.
     */
    getLastBlock() {
        return this.state.getLastBlock();
    }
    /**
     * Get the last height of the blockchain.
     */
    getLastHeight() {
        return this.state.getLastBlock().data.height;
    }
    /**
     * Get the last downloaded block of the blockchain.
     */
    getLastDownloadedBlock() {
        return this.state.lastDownloadedBlock || this.getLastBlock().data;
    }
    /**
     * Get the block ping.
     */
    getBlockPing() {
        return this.state.blockPing;
    }
    /**
     * Ping a block.
     */
    pingBlock(incomingBlock) {
        return this.state.pingBlock(incomingBlock);
    }
    /**
     * Push ping block.
     */
    pushPingBlock(block, fromForger = false) {
        this.state.pushPingBlock(block, fromForger);
    }
    /**
     * Check if the blockchain should roll back due to missing blocks.
     */
    async checkMissingBlocks() {
        this.missedBlocks++;
        if (this.missedBlocks >= crypto_1.Managers.configManager.getMilestone().activeDelegates / 3 - 1 &&
            Math.random() <= 0.8) {
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
exports.Blockchain = Blockchain;
//# sourceMappingURL=blockchain.js.map