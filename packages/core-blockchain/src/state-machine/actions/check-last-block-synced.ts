import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class CheckLastBlockSynced implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    public async handle(): Promise<void> {
        this.blockchain.dispatch(this.blockchain.isSynced() ? "SYNCED" : "NOTSYNCED");
    }
}
