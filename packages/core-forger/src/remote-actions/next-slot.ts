import { Container, Contracts } from "@arkecosystem/core-kernel";

import { ForgerService } from "../forger-service";

@Container.injectable()
export class NextSlotRemoteAction implements Contracts.Kernel.RemoteAction {
    public name = "forger.nextSlot";

    @Container.inject(Container.Identifiers.ForgerService)
    private readonly forger!: ForgerService;

    public async handler() {
        return {
            remainingTime: await this.forger.getRemainingSlotTime(),
        };
    }
}
