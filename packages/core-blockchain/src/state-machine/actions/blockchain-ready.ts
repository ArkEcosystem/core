import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";

import { Action } from "../contracts";

@Container.injectable()
export class BlockchainReady implements Action {
    @Container.inject(Container.Identifiers.Application)
    public readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly eventDispatcher!: Contracts.Kernel.EventDispatcher;

    public async handle(): Promise<void> {
        if (!this.stateStore.started) {
            this.stateStore.started = true;

            this.eventDispatcher.dispatch(Enums.StateEvent.Started, true);
        }
    }
}
