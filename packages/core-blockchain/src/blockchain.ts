import { DatabaseService, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Enums, Providers, Types, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Blocks, Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { ProcessBlocksJob } from "./process-blocks-job";
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

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.PeerRepository)
    private readonly peerRepository!: Contracts.P2P.PeerRepository;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private queue!: Contracts.Kernel.Queue;

    private stopped!: boolean;
    private booted: boolean = false;
    private missedBlocks: number = 0;
    private lastCheckNetworkHealthTs: number = 0;

    @Container.postConstruct()
    public async initialize(): Promise<void> {
        this.stopped = false;

        // flag to force a network start
        this.stateStore.setNetworkStart(this.configuration.getOptional("options.networkStart", false));

        if (this.stateStore.getNetworkStart()) {
            this.logger.warning(
                "ARK Core is launched in Genesis Start mode. This is usually for starting the first node on the blockchain. Unless you know what you are doing, this is likely wrong.",
            );
        }

        this.queue = await this.app.get<Types.QueueFactory>(Container.Identifiers.QueueFactory)();

        this.queue.on("drain", () => {
            this.dispatch("PROCESSFINISHED");
        });

        this.queue.on("jobError", (job, error) => {
            const blocks = (job as ProcessBlocksJob).getBlocks();

            this.logger.error(
                `Failed to process ${Utils.pluralize(
                    "block",
                    blocks.length,
                    true,
                )} from height ${blocks[0].height.toLocaleString()} in queue.`,
            );
        });
    }

    /**
     * Determine if the blockchain is stopped.
     */
    public isStopped(): boolean {
        return this.stopped;
    }

    public isBooted(): boolean {
        return this.booted;
    }

    public getQueue(): Contracts.Kernel.Queue {
        return this.queue;
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
        this.logger.info("Starting Blockchain Manager");

        this.stateStore.reset(blockchainMachine);

        this.dispatch("START");

        if (skipStartedCheck || process.env.CORE_SKIP_BLOCKCHAIN_STARTED_CHECK) {
            return true;
        }

        while (!this.stateStore.isStarted() && !this.stopped) {
            await Utils.sleep(1000);
        }

        await this.networkMonitor.cleansePeers({
            forcePing: true,
            peerCount: 10,
        });

        this.events.listen(Enums.ForgerEvent.Missing, { handle: this.checkMissingBlocks });

        this.events.listen(Enums.RoundEvent.Applied, { handle: this.resetMissedBlocks });

        this.booted = true;

        return true;
    }

    public async dispose(): Promise<void> {
        if (!this.stopped) {
            this.logger.info("Stopping Blockchain Manager");

            this.stopped = true;
            this.stateStore.clearWakeUpTimeout();

            this.dispatch("STOP");

            await this.queue.stop();
        }
    }

    /**
     * Set wakeup timeout to check the network for new blocks.
     */
    public setWakeUp(): void {
        this.stateStore.setWakeUpTimeout(() => {
            this.dispatch("WAKEUP");
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
     * Clear and stop the queue.
     * @return {void}
     */
    public clearAndStopQueue(): void {
        this.stateStore.setLastDownloadedBlock(this.getLastBlock().data);

        this.queue.pause();
        this.clearQueue();
    }

    /**
     * Clear the queue.
     * @return {void}
     */
    public clearQueue(): void {
        this.queue.clear();
    }

    /**
     * Push a block to the process queue.
     */
    public async handleIncomingBlock(block: Interfaces.IBlockData, fromForger = false): Promise<void> {
        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, block.height);

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

        this.pushPingBlock(block, fromForger);

        if (this.stateStore.isStarted()) {
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

        const __createQueueJob = (blocks: Interfaces.IBlockData[]) => {
            const processBlocksJob = this.app.resolve<ProcessBlocksJob>(ProcessBlocksJob);
            processBlocksJob.setBlocks(blocks);

            this.queue.push(processBlocksJob);
            this.queue.resume();
        };

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
                __createQueueJob(currentBlocksChunk);
                currentBlocksChunk = [];
                currentTransactionsCount = 0;
                if (nextMilestone) {
                    milestoneHeights.shift();
                }
            }
        }
        __createQueueJob(currentBlocksChunk);
    }

    /**
     * Remove N number of blocks.
     * @param  {Number} nblocks
     * @return {void}
     */
    public async removeBlocks(nblocks: number): Promise<void> {
        try {
            this.clearAndStopQueue();

            const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

            // If the current chain height is H and we will be removing blocks [N, H],
            // then blocksToRemove[] will contain blocks [N - 1, H - 1].
            const blocksToRemove: Interfaces.IBlockData[] = await this.database.getBlocks(
                lastBlock.data.height - nblocks,
                lastBlock.data.height,
            );

            const removedBlocks: Interfaces.IBlockData[] = [];
            const removedTransactions: Interfaces.ITransaction[] = [];

            const revertLastBlock = async () => {
                const lastBlock: Interfaces.IBlock = this.stateStore.getLastBlock();

                await this.databaseInteraction.revertBlock(lastBlock);
                removedBlocks.push(lastBlock.data);
                removedTransactions.push(...[...lastBlock.transactions].reverse());
                blocksToRemove.pop();

                let newLastBlock: Interfaces.IBlock;
                if (blocksToRemove[blocksToRemove.length - 1].height === 1) {
                    newLastBlock = this.stateStore.getGenesisBlock();
                } else {
                    const tempNewLastBlockData: Interfaces.IBlockData = blocksToRemove[blocksToRemove.length - 1];

                    Utils.assert.defined<Interfaces.IBlockData>(tempNewLastBlockData);

                    const tempNewLastBlock: Interfaces.IBlock | undefined = Blocks.BlockFactory.fromData(
                        tempNewLastBlockData,
                        {
                            deserializeTransactionsUnchecked: true,
                        },
                    );

                    Utils.assert.defined<Interfaces.IBlockData>(tempNewLastBlock);

                    newLastBlock = tempNewLastBlock;
                }

                this.stateStore.setLastBlock(newLastBlock);
                this.stateStore.setLastDownloadedBlock(newLastBlock.data);
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

            this.stateStore.setLastDownloadedBlock(lastBlock.data);

            await __removeBlocks(nblocks);

            await this.blockRepository.deleteBlocks(removedBlocks.reverse());
            this.stateStore.setLastStoredBlockHeight(lastBlock.data.height - nblocks);

            await this.transactionPool.readdTransactions(removedTransactions.reverse());

            // Validate last block
            const lastStoredBlock = await this.database.getLastBlock();

            if (lastStoredBlock.data.id !== this.stateStore.getLastBlock().data.id) {
                throw new Error(
                    `Last stored block (${lastStoredBlock.data.id}) is not the same as last block from state store (${
                        this.stateStore.getLastBlock().data.id
                    })`,
                );
            }
        } catch (err) {
            this.logger.error(err.stack);
            this.logger.warning("Shutting down app, because state might be corrupted");
            process.exit(1);
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
    }

    /**
     * Reset the last downloaded block to last chained block.
     */
    public resetLastDownloadedBlock(): void {
        this.stateStore.setLastDownloadedBlock(this.getLastBlock().data);
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
        this.stateStore.setForkedBlock(block);

        this.clearAndStopQueue();

        /* istanbul ignore else */
        if (numberOfBlockToRollback) {
            this.stateStore.setNumberOfBlocksToRollback(numberOfBlockToRollback);
        }

        this.dispatch("FORK");
    }

    /**
     * Determine if the blockchain is synced.
     */
    public isSynced(block?: Interfaces.IBlockData): boolean {
        if (!this.peerRepository.hasPeers()) {
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
        return this.stateStore.getLastDownloadedBlock() || this.getLastBlock().data;
    }

    /**
     * Get the block ping.
     */
    public getBlockPing(): Contracts.State.BlockPing | undefined {
        return this.stateStore.getBlockPing();
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

            const networkStatus = await this.networkMonitor.checkNetworkHealth();

            if (networkStatus.forked) {
                this.stateStore.setNumberOfBlocksToRollback(networkStatus.blocksToRollback || 0);
                this.dispatch("FORK");
            }
        }
    }

    private resetMissedBlocks(): void {
        this.missedBlocks = 0;
    }
}
