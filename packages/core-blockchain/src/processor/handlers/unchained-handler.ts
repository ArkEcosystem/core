import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

enum UnchainedBlockStatus {
    NotReadyToAcceptNewHeight,
    ExceededNotReadyToAcceptNewHeightMaxAttempts,
    AlreadyInBlockchain,
    EqualToLastBlock,
    GeneratorMismatch,
    DoubleForging,
    InvalidTimestamp,
}

class BlockNotReadyCounter {
    public static maxAttempts = 5;

    private id = "";
    private attempts = 0;

    public increment(block: Interfaces.IBlock): boolean {
        const { id } = block.data;
        let attemptsLeft = false;

        if (this.id !== id) {
            this.reset();
            this.id = Utils.assert.defined(id);
        }

        this.attempts += 1;

        attemptsLeft = this.attempts <= BlockNotReadyCounter.maxAttempts;

        if (!attemptsLeft) {
            this.reset();
        }

        return attemptsLeft;
    }

    public reset() {
        this.attempts = 0;
        this.id = "";
    }
}

// todo: remove the abstract and instead require a contract to be implemented
export class UnchainedHandler extends BlockHandler {
    public static notReadyCounter = new BlockNotReadyCounter();

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    private isValidGenerator: boolean = false;

    // todo: remove the need for this method
    public init(isValidGenerator: boolean): this {
        this.isValidGenerator = isValidGenerator;

        return this;
    }

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        super.execute(block);

        this.blockchain.clearQueue();

        const status: UnchainedBlockStatus = this.checkUnchainedBlock(block);

        switch (status) {
            case UnchainedBlockStatus.DoubleForging: {
                const roundInfo: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(block.data.height);
                const delegates: Contracts.State.Wallet[] = await app
                    .get<any>(Container.Identifiers.DatabaseService)
                    .getActiveDelegates(roundInfo);

                if (delegates.some(delegate => delegate.publicKey === block.data.generatorPublicKey)) {
                    this.blockchain.forkBlock(block);
                }

                return BlockProcessorResult.Rejected;
            }

            case UnchainedBlockStatus.ExceededNotReadyToAcceptNewHeightMaxAttempts: {
                this.blockchain.forkBlock(block, 5000); // TODO: find a better heuristic based on peer information

                return BlockProcessorResult.DiscardedButCanBeBroadcasted;
            }

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

            // Also remove all remaining queued blocks. Since blocks are downloaded in batches,
            // it is very likely that all blocks will be disregarded at this point anyway.
            // NOTE: This isn't really elegant, but still better than spamming the log with
            //       useless `not ready to accept` messages.
            if (this.blockchain.queue.length() > 0) {
                this.logger.debug(`Discarded ${this.blockchain.queue.length()} chunks of downloaded blocks.`);
            }

            // If we consecutively fail to accept the same block, our chain is likely forked. In this
            // case `increment` returns false.
            if (UnchainedHandler.notReadyCounter.increment(block)) {
                return UnchainedBlockStatus.NotReadyToAcceptNewHeight;
            }

            this.logger.debug(
                `Blockchain is still not ready to accept block at height ${block.data.height.toLocaleString()} after ${
                    BlockNotReadyCounter.maxAttempts
                } tries. Going to rollback. :warning:`,
            );

            return UnchainedBlockStatus.ExceededNotReadyToAcceptNewHeightMaxAttempts;
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
