import { Container, Contracts, Enums } from "@arkecosystem/core-kernel";

import { DisconnectPeer } from "./listeners";

// todo: review the implementation
@Container.injectable()
export class EventListener {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    public initialize(): void {
        this.events.listen(Enums.PeerEvent.Disconnect, this.app.resolve(DisconnectPeer));
    }
}
