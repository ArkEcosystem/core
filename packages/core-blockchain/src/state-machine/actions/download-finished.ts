import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class DownloadFinished implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async handle(): Promise<void> {
        this.logger.info("Block download finished");

        if (this.stateStore.getNetworkStart()) {
            // next time we will use normal behaviour
            this.stateStore.setNetworkStart(false);

            this.blockchain.dispatch("SYNCFINISHED");
        } else if (!this.blockchain.getQueue().isRunning()) {
            this.blockchain.dispatch("PROCESSFINISHED");
        }
    }
}
