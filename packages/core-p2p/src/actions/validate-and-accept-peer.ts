import { Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { ActionArguments } from "@arkecosystem/core-kernel/src/types";
import { PeerProcessor } from "@arkecosystem/core-p2p/src/peer-processor";

export class ValidateAndAcceptPeerAction extends Services.Triggers.Action {
    private app: Contracts.Kernel.Application;

    public constructor(app: Contracts.Kernel.Application) {
        super();
        this.app = app;
    }

    public async execute(args: ActionArguments): Promise<void> {
        let peer: Contracts.P2P.Peer = args.peer;
        let options: Contracts.P2P.AcceptNewPeerOptions = args.options;

        return this.app.get<PeerProcessor>(Container.Identifiers.PeerProcessor).validateAndAcceptPeer(peer, options);
    }
}
