import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class Stopped implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public async handle(): Promise<void> {
        this.logger.info("The blockchain has been stopped");
    }
}
