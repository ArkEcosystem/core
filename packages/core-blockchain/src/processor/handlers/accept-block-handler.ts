import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { BlockProcessorResult } from "../block-processor";
import { BlockHandler } from "./block-handler";

@Container.injectable()
export class AcceptBlockHandler extends BlockHandler {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.StateStore)
    protected readonly state: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly database: Contracts.Database.DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    protected readonly transactionPool: Contracts.TransactionPool.Connection;

    public async execute(block: Interfaces.IBlock): Promise<BlockProcessorResult> {
        try {
            await this.database.applyBlock(block);

            // Check if we recovered from a fork
            if (this.state.forkedBlock && this.state.forkedBlock.data.height === block.data.height) {
                this.logger.info("Successfully recovered from fork");
                this.state.forkedBlock = undefined;
            }

            if (this.transactionPool) {
                try {
                    await this.transactionPool.acceptChainedBlock(block);
                } catch (error) {
                    this.logger.warning("Issue applying block to transaction pool");
                    this.logger.debug(error.stack);
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

            return super.execute(block);
        }
    }
}
