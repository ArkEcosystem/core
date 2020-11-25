import { Container, Contracts } from "@arkecosystem/core-kernel";

import { ForgerService } from "../forger-service";

@Container.injectable()
export class NextSlotProcessAction implements Contracts.Kernel.ProcessAction {
    @Container.inject(Container.Identifiers.ForgerService)
    private readonly forger!: ForgerService;

    public name = "forger.nextSlot";

    public async handler() {
        return {
            remainingTime: this.forger.getRemainingSlotTime(),
        };
    }
}
