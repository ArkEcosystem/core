import { DatabaseService, Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Blocks, Crypto, Interfaces, Utils as CryptoUtils } from "@arkecosystem/crypto";

import { BlockProcessor, BlockProcessorResult } from "./processor";
import { RevertBlockHandler } from "./processor/handlers";
import { StateMachine } from "./state-machine/state-machine";

@Container.injectable()
export class ProcessBlocksJob implements Contracts.Kernel.QueueJob {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateMachine)
    private readonly stateMachine!: StateMachine;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    @Container.inject(Container.Identifiers.DatabaseBlockRepository)
    private readonly blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseInteraction)
    private readonly databaseInteraction!: DatabaseInteraction;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    @Container.inject(Container.Identifiers.TriggerService)
    private readonly triggers!: Services.Triggers.Triggers;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private blocks: Interfaces.IBlockData[] = [];

    /**
     * Get blocks.
     */
    public getBlocks(): Interfaces.IBlockData[] {
        return this.blocks;
    }

    /**
     * Set blocks.
     */
    public setBlocks(blocks: Interfaces.IBlockData[]): void {
        this.blocks = blocks;
    }

    /**
     * Process the given blocks.
     */
    public async handle(): Promise<void> {
        if (!this.blocks.length) {
            return;
        }

        const lastHeight = this.blockchain.getLastBlock().data.height;
        const fromHeight = this.blocks[0].height;
        const toHeight = this.blocks[this.blocks.length - 1].height;
        this.logger.debug(
            `Processing chunk of blocks [${fromHeight.toLocaleString()}, ${toHeight.toLocaleString()}] on top of ${lastHeight.toLocaleString()}`,
        );

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, this.blocks[0].height);

        if (
            !Utils.isBlockChained(this.blockchain.getLastBlock().data, this.blocks[0], blockTimeLookup) &&
            !CryptoUtils.isException(this.blocks[0])
        ) {
            this.logger.warning(
                Utils.getBlockNotChainedErrorMessage(
                    this.blockchain.getLastBlock().data,
                    this.blocks[0],
                    blockTimeLookup,
                ),
            );
            // Discard remaining blocks as it won't go anywhere anyway.
            this.blockchain.clearQueue();
            this.blockchain.resetLastDownloadedBlock();
            return;
        }

        const acceptedBlocks: Interfaces.IBlock[] = [];
        let forkBlock: Interfaces.IBlock | undefined = undefined;
        let lastProcessResult: BlockProcessorResult | undefined;
        let lastProcessedBlock: Interfaces.IBlock | undefined = undefined;

        const acceptedBlockTimeLookup = (height: number) => {
            return acceptedBlocks.find((b) => b.data.height === height)?.data.timestamp ?? blockTimeLookup(height);
        };

        try {
            for (const block of this.blocks) {
                const currentSlot: number = Crypto.Slots.getSlotNumber(acceptedBlockTimeLookup);
                const blockSlot: number = Crypto.Slots.getSlotNumber(acceptedBlockTimeLookup, block.timestamp);

                if (blockSlot > currentSlot) {
                    this.logger.error(
                        `Discarded block ${block.height.toLocaleString()} because it takes a future slot.`,
                    );
                    break;
                }

                const blockInstance = Blocks.BlockFactory.fromData(block);
                Utils.assert.defined<Interfaces.IBlock>(blockInstance);

                lastProcessResult = await this.triggers.call("processBlock", {
                    blockProcessor: this.app.get<BlockProcessor>(Container.Identifiers.BlockProcessor),
                    block: blockInstance,
                });

                lastProcessedBlock = blockInstance;

                if (lastProcessResult === BlockProcessorResult.Accepted) {
                    acceptedBlocks.push(blockInstance);
                } else if (lastProcessResult === BlockProcessorResult.Corrupted) {
                    await this.handleCorrupted();
                    return;
                } else {
                    if (lastProcessResult === BlockProcessorResult.Rollback) {
                        forkBlock = blockInstance;
                        this.stateStore.setLastDownloadedBlock(blockInstance.data);
                    }

                    break; // if one block is not accepted, the other ones won't be chained anyway
                }
            }
        } catch (error) {
            this.logger.error(
                `Failed to process chunk of block chunk of blocks [${fromHeight.toLocaleString()}, ${toHeight.toLocaleString()}] on top of ${lastHeight.toLocaleString()}`,
            );

            this.logger.error(error.stack);
        }

        if (acceptedBlocks.length > 0) {
            try {
                await this.blockRepository.saveBlocks(acceptedBlocks);
                this.stateStore.setLastStoredBlockHeight(acceptedBlocks[acceptedBlocks.length - 1].data.height);
            } catch (error) {
                this.logger.error(
                    `Could not save ${Utils.pluralize("block", acceptedBlocks.length, true)}) to database : ${
                        error.stack
                    }`,
                );

                await this.revertBlocks(acceptedBlocks);

                return;
            }
        }

        if (
            (lastProcessResult === BlockProcessorResult.Accepted ||
                lastProcessResult === BlockProcessorResult.DiscardedButCanBeBroadcasted) &&
            lastProcessedBlock
        ) {
            if (this.stateStore.isStarted() && this.stateMachine.getState() === "newBlock") {
                this.networkMonitor.broadcastBlock(lastProcessedBlock);
            }
        } else if (forkBlock) {
            this.blockchain.forkBlock(forkBlock);
        } else {
            this.blockchain.clearQueue();
            this.blockchain.resetLastDownloadedBlock();
        }

        return;
    }

    private async revertBlocks(blocksToRevert: Interfaces.IBlock[]): Promise<void> {
        // Rounds are saved while blocks are being processed and may now be out of sync with the last
        // block that was written into the database.

        const lastHeight: number = blocksToRevert[0].data.height;
        const deleteRoundsAfter: number = Utils.roundCalculator.calculateRound(lastHeight).round;

        this.logger.info(
            `Reverting ${Utils.pluralize(
                "block",
                blocksToRevert.length,
                true,
            )} back to last height: ${lastHeight.toLocaleString()}`,
        );

        for (const block of blocksToRevert.reverse()) {
            if (
                (await this.app.resolve<RevertBlockHandler>(RevertBlockHandler).execute(block)) ===
                BlockProcessorResult.Corrupted
            ) {
                await this.handleCorrupted();
            }
        }

        // TODO: Remove, because next rounds are deleted on restore
        await this.database.deleteRound(deleteRoundsAfter + 1);
        await this.databaseInteraction.restoreCurrentRound();

        this.blockchain.clearQueue();
        this.blockchain.resetLastDownloadedBlock();
    }

    private async handleCorrupted() {
        this.logger.error("Shutting down app, because state is corrupted");
        process.exit(1);
    }
}
