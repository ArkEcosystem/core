import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";

import { Action } from "../contracts";

@Container.injectable()
export class Initialize implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    private readonly transactionPool!: Contracts.TransactionPool.Service;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly databaseService!: DatabaseService;

    public async handle(): Promise<void> {
        try {
            const block: Interfaces.IBlock = this.stateStore.getLastBlock();

            if (!this.databaseService.restoredDatabaseIntegrity) {
                this.logger.info("Verifying database integrity");

                if (!(await this.databaseService.verifyBlockchain())) {
                    return this.blockchain.dispatch("ROLLBACK");
                }

                this.logger.info("Verified database integrity");
            } else {
                this.logger.info("Skipping database integrity check after successful database recovery");
            }

            // only genesis block? special case of first round needs to be dealt with
            if (block.data.height === 1) {
                if (block.data.payloadHash !== Managers.configManager.get("network.nethash")) {
                    this.logger.error("FATAL: The genesis block payload hash is different from configured the nethash");

                    return this.blockchain.dispatch("FAILURE");
                }

                await this.databaseService.deleteRound(1);
            }

            /** *******************************
             *  state machine data init      *
             ******************************* */
            this.stateStore.setLastBlock(block);

            // Delete all rounds from the future due to shutdown before processBlocks finished writing the blocks.
            const roundInfo = AppUtils.roundCalculator.calculateRound(block.data.height);
            await this.databaseService.deleteRound(roundInfo.round + 1);

            if (this.stateStore.networkStart) {
                await this.databaseService.buildWallets();
                await this.databaseService.restoreCurrentRound(block.data.height);
                await this.transactionPool.readdTransactions();
                await this.app.get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).boot();

                return this.blockchain.dispatch("STARTED");
            }

            if (process.env.NODE_ENV === "test") {
                this.logger.notice("TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.");

                await this.databaseService.buildWallets();
                await this.app.get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).boot();

                return this.blockchain.dispatch("STARTED");
            }

            this.logger.info(`Last block in database: ${block.data.height.toLocaleString()}`);

            /** *******************************
             * database init                 *
             ******************************* */
            // Integrity Verification
            await this.databaseService.buildWallets();

            await this.databaseService.restoreCurrentRound(block.data.height);
            await this.transactionPool.readdTransactions();

            await this.app.get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).boot();

            return this.blockchain.dispatch("STARTED");
        } catch (error) {
            this.logger.error(error.stack);

            return this.blockchain.dispatch("FAILURE");
        }
    }
}
