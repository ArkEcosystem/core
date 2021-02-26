import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class CheckLastDownloadedBlockSynced implements Action {
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.PeerNetworkMonitor)
    private readonly networkMonitor!: Contracts.P2P.NetworkMonitor;

    public async handle(): Promise<void> {
        let event = "NOTSYNCED";
        this.logger.debug(`Queued chunks of blocks (process: ${this.blockchain.getQueue().size()})`);

        if (this.blockchain.getQueue().size() > 100) {
            event = "PAUSED";
        }

        // tried to download but no luck after 5 tries (looks like network missing blocks)
        if (this.stateStore.getNoBlockCounter() > 5 && !this.blockchain.getQueue().isRunning()) {
            this.logger.info("Tried to sync 5 times to different nodes, looks like the network is missing blocks");

            this.stateStore.setNoBlockCounter(0);
            event = "NETWORKHALTED";

            if (this.stateStore.getP2pUpdateCounter() + 1 > 3) {
                this.logger.info("Network keeps missing blocks.");

                const networkStatus = await this.networkMonitor.checkNetworkHealth();

                if (networkStatus.forked) {
                    this.stateStore.setNumberOfBlocksToRollback(networkStatus.blocksToRollback || 0);
                    event = "FORK";
                }

                this.stateStore.setP2pUpdateCounter(0);
            } else {
                this.stateStore.setP2pUpdateCounter(this.stateStore.getP2pUpdateCounter() + 1);
            }
        } else if (
            this.stateStore.getLastDownloadedBlock() &&
            this.blockchain.isSynced(this.stateStore.getLastDownloadedBlock())
        ) {
            this.stateStore.setNoBlockCounter(0);
            this.stateStore.setP2pUpdateCounter(0);

            event = "SYNCED";
        }

        if (this.stateStore.getNetworkStart()) {
            event = "SYNCED";
        }

        if (process.env.CORE_ENV === "test") {
            event = "TEST";
        }

        this.blockchain.dispatch(event);
    }
}
