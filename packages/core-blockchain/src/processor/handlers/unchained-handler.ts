import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Blockchain } from "../../blockchain";
import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

enum UnchainedBlockStatus {
    NotReadyToAcceptNewHeight,
    AlreadyInBlockchain,
    EqualToLastBlock,
    GeneratorMismatch,
    DoubleForging,
}

export class UnchainedHandler extends BlockHandler {
    public constructor(protected blockchain: Blockchain, protected block: any, private isValidGenerator: boolean) {
        super(blockchain, block);
    }

    public async execute(): Promise<BlockProcessorResult> {
        super.execute();

        this.blockchain.processQueue.clear();

        const status = this.checkUnchainedBlock();
        switch (status) {
            case UnchainedBlockStatus.DoubleForging: {
                const database = app.resolvePlugin("database");
                const delegates = await database.getActiveDelegates(this.block.data.height);
                if (delegates.some(delegate => delegate.publicKey === this.block.data.generatorPublicKey)) {
                    this.blockchain.forkBlock(this.block);
                }

                return BlockProcessorResult.Rejected;
            }

            case UnchainedBlockStatus.GeneratorMismatch: {
                return BlockProcessorResult.Rejected;
            }

            default: {
                return BlockProcessorResult.DiscardedButCanBeBroadcasted;
            }
        }
    }

    private checkUnchainedBlock(): UnchainedBlockStatus {
        const lastBlock = this.blockchain.getLastBlock();
        if (this.block.data.height > lastBlock.data.height + 1) {
            logger.debug(
                `Blockchain not ready to accept new block at height ${this.block.data.height.toLocaleString()}. Last block: ${lastBlock.data.height.toLocaleString()} :warning:`,
            );

            // Also remove all remaining queued blocks. Since blocks are downloaded in batches,
            // it is very likely that all blocks will be disregarded at this point anyway.
            // NOTE: This isn't really elegant, but still better than spamming the log with
            //       useless `not ready to accept` messages.
            if (this.blockchain.processQueue.length() > 0) {
                logger.debug(`Discarded ${this.blockchain.processQueue.length()} downloaded blocks.`);
            }

            return UnchainedBlockStatus.NotReadyToAcceptNewHeight;
        } else if (this.block.data.height < lastBlock.data.height) {
            logger.debug(
                `Block ${this.block.data.height.toLocaleString()} disregarded because already in blockchain :warning:`,
            );

            return UnchainedBlockStatus.AlreadyInBlockchain;
        } else if (this.block.data.height === lastBlock.data.height && this.block.data.id === lastBlock.data.id) {
            logger.debug(`Block ${this.block.data.height.toLocaleString()} just received :chains:`);
            return UnchainedBlockStatus.EqualToLastBlock;
        } else {
            if (this.isValidGenerator) {
                logger.warn(`Detect double forging by ${this.block.data.generatorPublicKey} :chains:`);
                return UnchainedBlockStatus.DoubleForging;
            }

            logger.info(
                `Forked block disregarded because it is not allowed to be forged. Caused by delegate: ${
                    this.block.data.generatorPublicKey
                } :bangbang:`,
            );

            return UnchainedBlockStatus.GeneratorMismatch;
        }
    }
}
