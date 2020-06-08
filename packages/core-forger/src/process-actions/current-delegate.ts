import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { ForgerService } from "../forger-service";

@Container.injectable()
export class CurrentDelegateProcessAction implements Contracts.Kernel.ProcessAction {
    public name = "forger.currentDelegate";

    @Container.inject(Container.Identifiers.ForgerService)
    private readonly forger!: ForgerService;

    public async handler() {
        const round = this.forger.getRound();

        Utils.assert.defined(round);

        return {
            username: round!.currentForger.delegate.username,
            rank: round!.currentForger.delegate.rank,
        };
    }
}
