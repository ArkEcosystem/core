import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Action } from "../contracts";

@Container.injectable()
export class RollbackDatabase implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    public async handle(): Promise<void> {
        this.logger.info("Trying to restore database integrity");

        const config =
            this.app
                .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
                .get("@arkecosystem/core-blockchain")
                .config()
                .get<Record<string, number>>("databaseRollback") || {};

        AppUtils.assert.defined<number>(config.maxBlockRewind);
        AppUtils.assert.defined<number>(config.steps);

        const maxBlockRewind: number = config.maxBlockRewind;
        const steps: number = config.steps;

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
