import { Container, Contracts } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class ExitApp implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    public async handle(): Promise<void> {
        this.app.terminate("Failed to startup blockchain. Exiting ARK Core!");
    }
}
