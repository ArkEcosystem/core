import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class StartForkRecovery implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async handle(): Promise<void> {
        this.logger.info("Starting fork recovery");

        this.blockchain.clearAndStopQueue();

        const random: number = 4 + Math.floor(Math.random() * 99); // random int inside [4, 102] range
        const blocksToRemove: number = this.stateStore.numberOfBlocksToRollback || random;

        await this.blockchain.removeBlocks(blocksToRemove);

        this.stateStore.numberOfBlocksToRollback = undefined;

        this.logger.info(`Removed ${AppUtils.pluralize("block", blocksToRemove, true)}`);

        await this.app
            .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
            .refreshPeersAfterFork();

        this.blockchain.dispatch("SUCCESS");
        this.blockchain.queue.resume();
    }
}
