import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Action } from "../contracts";

@Container.injectable()
export class RollbackDatabase implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-blockchain")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async handle(): Promise<void> {
        this.logger.info("Trying to restore database integrity");

        let maxBlockRewind = this.configuration.getRequired<number>("databaseRollback.maxBlockRewind");
        let steps = this.configuration.getRequired<number>("databaseRollback.steps");

        let lastBlock: Interfaces.IBlock = await this.databaseService.getLastBlock();
        let lastBlockHeight = lastBlock.data.height;

        let isVerified = false;

        while (!isVerified && maxBlockRewind > 0 && lastBlockHeight > 1) {
            if (lastBlockHeight - steps < 1) {
                steps = lastBlockHeight - 1;
            }
            maxBlockRewind -= steps;
            lastBlockHeight -= steps;

            await this.blockchain.removeTopBlocks(steps);

            isVerified = await this.databaseService.verifyBlockchain();
        }

        if (!isVerified) {
            this.blockchain.dispatch("FAILURE");
            return;
        }

        this.stateStore.setRestoredDatabaseIntegrity(true);

        lastBlock = await this.databaseService.getLastBlock();
        this.stateStore.setLastBlock(lastBlock);
        this.stateStore.setLastStoredBlockHeight(lastBlock.data.height);

        this.logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()}`,
        );

        this.blockchain.dispatch("SUCCESS");
    }
}
