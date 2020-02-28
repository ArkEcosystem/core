import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class CheckLastDownloadedBlockSynced implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async handle(): Promise<void> {
        let event = "NOTSYNCED";
        this.logger.debug(`Queued chunks of blocks (process: ${this.blockchain.queue.length()})`);

        if (this.blockchain.queue.length() > 100) {
            event = "PAUSED";
        }

        // tried to download but no luck after 5 tries (looks like network missing blocks)
        if (this.stateStore.noBlockCounter > 5 && this.blockchain.queue.idle()) {
            this.logger.info("Tried to sync 5 times to different nodes, looks like the network is missing blocks");

            this.stateStore.noBlockCounter = 0;
            event = "NETWORKHALTED";

            if (this.stateStore.p2pUpdateCounter + 1 > 3) {
                this.logger.info("Network keeps missing blocks.");

                const networkStatus = await this.app
                    .get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                    .checkNetworkHealth();

                if (networkStatus.forked) {
                    this.stateStore.numberOfBlocksToRollback = networkStatus.blocksToRollback;
                    event = "FORK";
                }

                this.stateStore.p2pUpdateCounter = 0;
            } else {
                this.stateStore.p2pUpdateCounter++;
            }
        } else if (
            this.stateStore.lastDownloadedBlock &&
            this.blockchain.isSynced(this.stateStore.lastDownloadedBlock)
        ) {
            this.stateStore.noBlockCounter = 0;
            this.stateStore.p2pUpdateCounter = 0;

            event = "SYNCED";
        }

        if (this.stateStore.networkStart) {
            event = "SYNCED";
        }

        if (process.env.CORE_ENV === "test") {
            event = "TEST";
        }

        this.blockchain.dispatch(event);
    }
}
