import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { DatabaseInteraction } from "@arkecosystem/core-state";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "../contracts";

@Container.injectable()
export class RevertBlockHandler implements BlockHandler {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly state!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseInteraction)
    private readonly databaseInteraction!: DatabaseInteraction;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly transactionPool!: Contracts.TransactionPool.Service;

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        try {
            await this.databaseInteraction.revertBlock(block);

            // TODO: Check if same situation applies to fork revert
            for (const transaction of block.transactions) {
                await this.transactionPool.addTransaction(transaction);
            }

            // Remove last block, take from DB if list is empty
            let previousBlock: Interfaces.IBlock | undefined = this.state
                .getLastBlocks()
                .find((stateBlock) => stateBlock.data.height === block.data.height - 1);

            if (!previousBlock) {
                previousBlock = await this.database.getLastBlock();
            }

            if (previousBlock.data.height + 1 !== block.data.height) {
                throw new Error(
                    `Previous block height is invalid. Found block with height ${previousBlock.data.height} instead ${
                        block.data.height - 1
                    }`,
                );
            }

            this.state.setLastBlock(previousBlock);

            return BlockProcessorResult.Reverted;
        } catch (error) {
            this.logger.error(
                `Critical error occurs when reverting block at height ${block.data.height.toLocaleString()}. Possible state corruption. Message: ${
                    error.message
                }`,
            );

            return BlockProcessorResult.Corrupted;
        }
    }
}
