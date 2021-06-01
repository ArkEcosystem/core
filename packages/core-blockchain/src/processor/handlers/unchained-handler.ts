import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "../contracts";

enum UnchainedBlockStatus {
    NotReadyToAcceptNewHeight,
    AlreadyInBlockchain,
    EqualToLastBlock,
    GeneratorMismatch,
    DoubleForging,
    InvalidTimestamp,
}

@Container.injectable()
export class UnchainedHandler implements BlockHandler {
    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.TriggerService)
    private readonly triggers!: Services.Triggers.Triggers;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private isValidGenerator: boolean = false;

    // todo: remove the need for this method
    public initialize(isValidGenerator: boolean): this {
        this.isValidGenerator = isValidGenerator;

        return this;
    }

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        this.blockchain.resetLastDownloadedBlock();

        this.blockchain.clearQueue();

        const status: UnchainedBlockStatus = this.checkUnchainedBlock(block);

        switch (status) {
            case UnchainedBlockStatus.DoubleForging: {
                const roundInfo: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(block.data.height);

                const delegates: Contracts.State.Wallet[] = (await this.triggers.call("getActiveDelegates", {
                    roundInfo,
                })) as Contracts.State.Wallet[];

                if (delegates.some((delegate) => delegate.getPublicKey() === block.data.generatorPublicKey)) {
                    return BlockProcessorResult.Rollback;
                }

                return BlockProcessorResult.Rejected;
            }

            case UnchainedBlockStatus.NotReadyToAcceptNewHeight:
            case UnchainedBlockStatus.GeneratorMismatch:
            case UnchainedBlockStatus.InvalidTimestamp: {
                return BlockProcessorResult.Rejected;
            }

            default: {
                return BlockProcessorResult.DiscardedButCanBeBroadcasted;
            }
        }
    }

    private checkUnchainedBlock(block: Interfaces.IBlock): UnchainedBlockStatus {
        const lastBlock: Interfaces.IBlock = this.blockchain.getLastBlock();

        // todo: clean up this if-else-if-else-if-else mess
        if (block.data.height > lastBlock.data.height + 1) {
            this.logger.debug(
                `Blockchain not ready to accept new block at height ${block.data.height.toLocaleString()}. Last block: ${lastBlock.data.height.toLocaleString()}`,
            );

            return UnchainedBlockStatus.NotReadyToAcceptNewHeight;
        } else if (block.data.height < lastBlock.data.height) {
            this.logger.debug(`Block ${block.data.height.toLocaleString()} disregarded because already in blockchain`);

            return UnchainedBlockStatus.AlreadyInBlockchain;
        } else if (block.data.height === lastBlock.data.height && block.data.id === lastBlock.data.id) {
            this.logger.debug(`Block ${block.data.height.toLocaleString()} just received`);

            return UnchainedBlockStatus.EqualToLastBlock;
        } else if (block.data.timestamp < lastBlock.data.timestamp) {
            this.logger.debug(
                `Block ${block.data.height.toLocaleString()} disregarded, because the timestamp is lower than the previous timestamp.`,
            );
            return UnchainedBlockStatus.InvalidTimestamp;
        } else {
            if (this.isValidGenerator) {
                this.logger.warning(`Detect double forging by ${block.data.generatorPublicKey}`);
                return UnchainedBlockStatus.DoubleForging;
            }

            this.logger.info(
                `Forked block disregarded because it is not allowed to be forged. Caused by delegate: ${block.data.generatorPublicKey}`,
            );

            return UnchainedBlockStatus.GeneratorMismatch;
        }
    }
}
