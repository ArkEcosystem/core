import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { ForgerService } from "../forger-service";

@Container.injectable()
export class LastForgedBlockRemoteAction implements Contracts.Kernel.ProcessAction {
    @Container.inject(Container.Identifiers.ForgerService)
    private readonly forger!: ForgerService;

    public name = "forger.lastForgedBlock";

    public async handler() {
        const lastForgedBlock = this.forger.getLastForgedBlock();

        Utils.assert.defined(lastForgedBlock);

        return lastForgedBlock!.data;
    }
}
