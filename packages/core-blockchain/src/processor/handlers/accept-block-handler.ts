import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "../contracts";

// todo: remove the abstract and instead require a contract to be implemented
@Container.injectable()
export class AcceptBlockHandler implements BlockHandler {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly state!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly transactionPool!: Contracts.TransactionPool.Service;

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        try {
            await this.database.applyBlock(block);

            // Check if we recovered from a fork
            if (this.state.forkedBlock && this.state.forkedBlock.data.height === block.data.height) {
                this.logger.info("Successfully recovered from fork");
                this.state.forkedBlock = undefined;
            }

            if (this.transactionPool) {
                for (const transaction of block.transactions) {
                    this.transactionPool.acceptForgedTransaction(transaction);
                }
            }

            // Reset wake-up timer after chaining a block, since there's no need to
            // wake up at all if blocks arrive periodically. Only wake up when there are
            // no new blocks.
            if (this.state.started) {
                this.blockchain.resetWakeUp();
            }

            this.state.setLastBlock(block);

            // Ensure the lastDownloadedBlock is never behind the last accepted block.
            if (this.state.lastDownloadedBlock && this.state.lastDownloadedBlock.height < block.data.height) {
                this.state.lastDownloadedBlock = block.data;
            }

            return BlockProcessorResult.Accepted;
        } catch (error) {
            this.logger.warning(`Refused new block ${JSON.stringify(block.data)}`);
            this.logger.debug(error.stack);

            this.blockchain.resetLastDownloadedBlock();

            return BlockProcessorResult.Rejected;
        }
    }
}
