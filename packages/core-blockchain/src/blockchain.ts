import { DatabaseService, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Enums, Providers, Services, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Blocks, Crypto, Interfaces, Managers, Utils as CryptoUtils } from "@arkecosystem/crypto";
import async from "async";

import { BlockProcessor, BlockProcessorResult } from "./processor";
import { StateMachine } from "./state-machine";
import { blockchainMachine } from "./state-machine/machine";

// todo: reduce the overall complexity of this class and remove all helpers and getters that just serve as proxies
@Container.injectable()
export class Blockchain implements Contracts.Blockchain.Blockchain {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-blockchain")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseInteraction)
    private readonly databaseInteraction!: DatabaseInteraction;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly transactionPool!: Contracts.TransactionPool.Service;

    @Container.inject(Container.Identifiers.StateMachine)
    private readonly stateMachine!: StateMachine;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    // todo: make this private
    public isStopped!: boolean;
    // todo: make this private
    public options: any;
    // todo: make this private and use a queue instance from core-kernel
    // @ts-ignore
    public queue: async.AsyncQueue<any>;

    private missedBlocks: number = 0;
    private lastCheckNetworkHealthTs: number = 0;

    @Container.postConstruct()
    public initialize(): void {
        this.isStopped = false;

        // flag to force a network start
        this.stateStore.networkStart = this.configuration.getOptional("options.networkStart", false);

        if (this.stateStore.networkStart) {
            this.logger.warning(
                "ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
        }

        this.queue = async.queue(async (blockList: { blocks: Interfaces.IBlockData[] }): Promise<
            Interfaces.IBlock[] | undefined
        > => {
            try {
                return await this.processBlocks(blockList.blocks);
            } catch (error) {
                this.logger.error(
                    `Failed to process ${blockList.blocks.length} blocks from height ${blockList.blocks[0].height} in queue.`,
                );
                return undefined;
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
    public dispatch(event: string): void {
        return this.stateMachine.transition(event);
    }

    /**
     * Start the blockchain and wait for it to be ready.
     * @return {void}
     */
    public async boot(skipStartedCheck = false): Promise<boolean> {
        this.logger.info("Starting Blockchain Manager :chains:");

        this.stateStore.reset(blockchainMachine);

        this.dispatch("START");

        if (skipStartedCheck || process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK) {
            return true;
        }

        while (!this.stateStore.started && !this.isStopped) {
            await Utils.sleep(1000);
        }

        this.app.get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).cleansePeers({
            forcePing: true,
            peerCount: 10,
        });

        this.events.listen(Enums.ForgerEvent.Missing, { handle: this.checkMissingBlocks });

        this.events.listen(Enums.RoundEvent.Applied, { handle: this.resetMissedBlocks });

        return true;
    }

    public async dispose(): Promise<void> {
        if (!this.isStopped) {
            this.logger.info("Stopping Blockchain Manager :chains:");

            this.isStopped = true;
            this.stateStore.clearWakeUpTimeout();

            this.dispatch("STOP");

            this.queue.kill();
        }
    }

    /**
     * Set wakeup timeout to check the network for new blocks.
     */
    public setWakeUp(): void {
        this.stateStore.wakeUpTimeout = setTimeout(() => {
            this.stateStore.wakeUpTimeout = undefined;
            return this.dispatch("WAKEUP");
        }, 60000);
    }

    /**
     * Reset the wakeup timeout.
     */
    public resetWakeUp(): void {
        this.stateStore.clearWakeUpTimeout();
        this.setWakeUp();
    }

    /**
     * Update network status.
     * @return {void}
     */
    public async updateNetworkStatus(): Promise<void> {
        await this.app
            .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
            .updateNetworkStatus();
    }

    /**
     * Clear and stop the queue.
     * @return {void}
     */
    public clearAndStopQueue(): void {
        this.stateStore.lastDownloadedBlock = this.getLastBlock().data;

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
    public async handleIncomingBlock(block: Interfaces.IBlockData, fromForger = false): Promise<void> {
        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, block.height);

        this.pushPingBlock(block, fromForger);

        const currentSlot: number = Crypto.Slots.getSlotNumber(blockTimeLookup);
        const receivedSlot: number = Crypto.Slots.getSlotNumber(blockTimeLookup, block.timestamp);

        if (fromForger) {
            const minimumMs: number = 2000;
            const timeLeftInMs: number = Crypto.Slots.getTimeInMsUntilNextSlot(blockTimeLookup);
            if (currentSlot !== receivedSlot || timeLeftInMs < minimumMs) {
                this.logger.info(`Discarded block ${block.height.toLocaleString()} because it was received too late.`);
                return;
            }
        }

        if (receivedSlot > currentSlot) {
            this.logger.info(`Discarded block ${block.height.toLocaleString()} because it takes a future slot.`);
            return;
        }

        if (this.stateStore.started) {
            this.dispatch("NEWBLOCK");
            this.enqueueBlocks([block]);

            this.events.dispatch(Enums.BlockEvent.Received, block);
        } else {
            this.logger.info(`Block disregarded because blockchain is not ready`);

            this.events.dispatch(Enums.BlockEvent.Disregarded, block);
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
            .map((milestone) => milestone.height)
            .sort((a, b) => a - b)
            .filter((height) => height >= lastDownloadedHeight);

        // divide blocks received into chunks depending on number of transactions
        // this is to avoid blocking the application when processing "heavy" blocks
        let currentBlocksChunk: any[] = [];
        let currentTransactionsCount = 0;
        for (const block of blocks) {
            Utils.assert.defined<Interfaces.IBlockData>(block);

            currentBlocksChunk.push(block);
            currentTransactionsCount += block.numberOfTransactions;

            const nextMilestone = milestoneHeights[0] && milestoneHeights[0] === block.height;

            if (
                currentTransactionsCount >= 150 ||
                currentBlocksChunk.length >= Math.min(this.stateStore.getMaxLastBlocks(), 100) ||
                nextMilestone
            ) {
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
    public async removeBlocks(nblocks: number): Promise<void> {
        this.clearAndStopQueue();

        const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

        // If the current chain height is H and we will be removing blocks [N, H],
        // then blocksToRemove[] will contain blocks [N - 1, H - 1].
        const blocksToRemove: Interfaces.IBlockData[] = await this.database.getBlocks(
            lastBlock.data.height - nblocks,
            nblocks,
        );

        const removedBlocks: Interfaces.IBlockData[] = [];
        const removedTransactions: Interfaces.ITransaction[] = [];

        const revertLastBlock = async () => {
            const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

            await this.databaseInteraction.revertBlock(lastBlock);
            removedBlocks.push(lastBlock.data);
            removedTransactions.push(...[...lastBlock.transactions].reverse());

            let newLastBlock: Interfaces.IBlock;
            if (blocksToRemove[blocksToRemove.length - 1].height === 1) {
                newLastBlock = this.app.get<any>(Container.Identifiers.StateStore).getGenesisBlock();
            } else {
                const tempNewLastBlockData: Interfaces.IBlockData | undefined = blocksToRemove.pop();

                Utils.assert.defined<Interfaces.IBlockData>(tempNewLastBlockData);

                const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(
                    this.app,
                    lastBlock.data.height,
                );

                const tempNewLastBlock: Interfaces.IBlock | undefined = Blocks.BlockFactory.fromData(
                    tempNewLastBlockData,
                    blockTimeLookup,
                    {
                        deserializeTransactionsUnchecked: true,
                    },
                );

                Utils.assert.defined<Interfaces.IBlockData>(tempNewLastBlock);

                newLastBlock = tempNewLastBlock;
            }

            this.stateStore.setLastBlock(newLastBlock);
            this.stateStore.lastDownloadedBlock = newLastBlock.data;
        };

        const __removeBlocks = async (numberOfBlocks) => {
            if (numberOfBlocks < 1) {
                return;
            }

            const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

            this.logger.info(`Undoing block ${lastBlock.data.height.toLocaleString()}`);

            await revertLastBlock();
            await __removeBlocks(numberOfBlocks - 1);
        };

        if (nblocks >= lastBlock.data.height) {
            nblocks = lastBlock.data.height - 1;
        }

        const resetHeight: number = lastBlock.data.height - nblocks;
        this.logger.info(
            `Removing ${Utils.pluralize("block", nblocks, true)}. Reset to height ${resetHeight.toLocaleString()}`,
        );

        this.stateStore.lastDownloadedBlock = lastBlock.data;

        await __removeBlocks(nblocks);

        await this.blockRepository.deleteBlocks(removedBlocks.reverse());

        if (this.transactionPool) {
            this.transactionPool.readdTransactions(removedTransactions.reverse());
        }
    }

    /**
     * Remove the top blocks from database.
     * NOTE: Only used when trying to restore database integrity.
     * @param  {Number} count
     * @return {void}
     */
    public async removeTopBlocks(count: number): Promise<void> {
        this.logger.info(`Removing top ${Utils.pluralize("block", count, true)}`);

        await this.blockRepository.deleteTopBlocks(count);
        await this.databaseInteraction.loadBlocksFromCurrentRound();
    }

    /**
     * Process the given block.
     */
    public async processBlocks(blocks: Interfaces.IBlockData[]): Promise<Interfaces.IBlock[] | undefined> {
        if (blocks.length) {
            const lastHeight = this.getLastBlock().data.height;
            const fromHeight = blocks[0].height;
            const toHeight = blocks[blocks.length - 1].height;
            this.logger.debug(`Processing chunk of blocks [${fromHeight}, ${toHeight}] on top of ${lastHeight}`);
        }

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, blocks[0].height);

        const acceptedBlocks: Interfaces.IBlock[] = [];
        let lastProcessResult: BlockProcessorResult | undefined;

        if (
            blocks[0] &&
            !Utils.isBlockChained(this.getLastBlock().data, blocks[0], blockTimeLookup) &&
            !CryptoUtils.isException(blocks[0])
        ) {
            this.logger.warning(
                Utils.getBlockNotChainedErrorMessage(this.getLastBlock().data, blocks[0], blockTimeLookup),
            );
            // Discard remaining blocks as it won't go anywhere anyway.
            this.clearQueue();
            this.resetLastDownloadedBlock();
            return undefined;
        }

        let forkBlock: Interfaces.IBlock | undefined = undefined;
        let lastProcessedBlock: Interfaces.IBlock | undefined = undefined;
        for (const block of blocks) {
            const blockInstance = Blocks.BlockFactory.fromData(block, blockTimeLookup);
            Utils.assert.defined<Interfaces.IBlock>(blockInstance);

            lastProcessResult = await this.app
                .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                .call("processBlock", {
                    blockProcessor: this.app.get<BlockProcessor>(Container.Identifiers.BlockProcessor),
                    block: blockInstance,
                });
            lastProcessedBlock = blockInstance;

            if (lastProcessResult === BlockProcessorResult.Accepted) {
                acceptedBlocks.push(blockInstance);
                this.stateStore.lastDownloadedBlock = blockInstance.data;
            } else {
                if (lastProcessResult === BlockProcessorResult.Rollback) {
                    forkBlock = blockInstance;
                    this.stateStore.lastDownloadedBlock = blockInstance.data;
                }

                break; // if one block is not accepted, the other ones won't be chained anyway
            }
        }

        if (acceptedBlocks.length > 0) {
            try {
                await this.blockRepository.saveBlocks(acceptedBlocks);
            } catch (error) {
                this.logger.error(`Could not save ${acceptedBlocks.length} blocks to database : ${error.stack}`);

                this.clearQueue();

                // Rounds are saved while blocks are being processed and may now be out of sync with the last
                // block that was written into the database.

                const lastBlock: Interfaces.IBlock = await this.database.getLastBlock();
                const lastHeight: number = lastBlock.data.height;
                const deleteRoundsAfter: number = Utils.roundCalculator.calculateRound(lastHeight).round;

                this.logger.info(
                    `Reverting ${Utils.pluralize(
                        "block",
                        acceptedBlocks.length,
                        true,
                    )} back to last height: ${lastHeight}`,
                );

                for (const block of acceptedBlocks.reverse()) {
                    await this.databaseInteraction.revertBlock(block);
                }

                this.stateStore.setLastBlock(lastBlock);
                this.resetLastDownloadedBlock();

                await this.database.deleteRound(deleteRoundsAfter + 1);
                await this.databaseInteraction.loadBlocksFromCurrentRound();

                return undefined;
            }
        }

        if (
            (lastProcessResult === BlockProcessorResult.Accepted ||
                lastProcessResult === BlockProcessorResult.DiscardedButCanBeBroadcasted) &&
            lastProcessedBlock
        ) {
            if (
                this.stateStore.started &&
                Crypto.Slots.getSlotInfo(blockTimeLookup).startTime <= lastProcessedBlock.data.timestamp
            ) {
                this.app
                    .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                    .broadcastBlock(lastProcessedBlock);
            }
        } else if (forkBlock) {
            this.forkBlock(forkBlock);
        }

        return acceptedBlocks;
    }

    /**
     * Reset the last downloaded block to last chained block.
     */
    public resetLastDownloadedBlock(): void {
        this.stateStore.lastDownloadedBlock = this.getLastBlock().data;
    }

    /**
     * Called by forger to wake up and sync with the network.
     * It clears the wakeUpTimeout if set.
     */
    public forceWakeup(): void {
        this.stateStore.clearWakeUpTimeout();

        this.dispatch("WAKEUP");
    }

    /**
     * Fork the chain at the given block.
     */
    public forkBlock(block: Interfaces.IBlock, numberOfBlockToRollback?: number): void {
        this.stateStore.forkedBlock = block;

        this.clearAndStopQueue();

        if (numberOfBlockToRollback) {
            this.stateStore.numberOfBlocksToRollback = numberOfBlockToRollback;
        }

        this.dispatch("FORK");
    }

    /**
     * Determine if the blockchain is synced.
     */
    public isSynced(block?: Interfaces.IBlockData): boolean {
        if (!this.app.get<Contracts.P2P.PeerStorage>(Container.Identifiers.PeerStorage).hasPeers()) {
            return true;
        }

        block = block || this.getLastBlock().data;

        return (
            Crypto.Slots.getTime() - block.timestamp < 3 * Managers.configManager.getMilestone(block.height).blocktime
        );
    }

    /**
     * Get the last block of the blockchain.
     */
    public getLastBlock(): Interfaces.IBlock {
        return this.stateStore.getLastBlock();
    }

    /**
     * Get the last height of the blockchain.
     */
    public getLastHeight(): number {
        return this.getLastBlock().data.height;
    }

    /**
     * Get the last downloaded block of the blockchain.
     */
    public getLastDownloadedBlock(): Interfaces.IBlockData {
        return this.stateStore.lastDownloadedBlock || this.getLastBlock().data;
    }

    /**
     * Get the block ping.
     */
    public getBlockPing(): {
        count: number;
        first: number;
        last: number;
        block: Interfaces.IBlockData;
    } {
        return this.stateStore.blockPing;
    }

    /**
     * Ping a block.
     */
    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        return this.stateStore.pingBlock(incomingBlock);
    }

    /**
     * Push ping block.
     */
    public pushPingBlock(block: Interfaces.IBlockData, fromForger = false): void {
        this.stateStore.pushPingBlock(block, fromForger);
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
            this.resetMissedBlocks();

            // do not check network health here more than every 10 minutes
            const nowTs = Date.now();
            if (nowTs - this.lastCheckNetworkHealthTs < 10 * 60 * 1000) {
                return;
            }
            this.lastCheckNetworkHealthTs = nowTs;

            const networkStatus = await this.app
                .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                .checkNetworkHealth();

            if (networkStatus.forked) {
                this.stateStore.numberOfBlocksToRollback = networkStatus.blocksToRollback;
                this.dispatch("FORK");
            }
        }
    }

    private resetMissedBlocks(): void {
        this.missedBlocks = 0;
    }
}
