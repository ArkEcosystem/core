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

    public async handle(): Promise<void> {
        this.logger.info("Trying to restore database integrity");

        const maxBlockRewind = this.configuration.getRequired<number>("databaseRollback.maxBlockRewind");
        const steps = this.configuration.getRequired<number>("databaseRollback.steps");

        for (let i = maxBlockRewind; i >= 0; i -= steps) {
            await this.blockchain.removeTopBlocks(steps);

            if (await this.databaseService.verifyBlockchain()) {
                break;
            }
        }

        if (!(await this.databaseService.verifyBlockchain())) {
            this.blockchain.dispatch("FAILURE");
            return;
        }

        this.databaseService.restoredDatabaseIntegrity = true;

        const lastBlock: Interfaces.IBlock = await this.databaseService.getLastBlock();
        this.logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()}`,
        );

        this.blockchain.dispatch("SUCCESS");
    }
}
