import { Container, Contracts, Services, Types } from "@arkecosystem/core-kernel";
import { PeerProcessor } from "../peer-processor";

export class ValidateAndAcceptPeerAction extends Services.Triggers.Action {
    private app: Contracts.Kernel.Application;

    public constructor(app: Contracts.Kernel.Application) {
        super();
        this.app = app;
    }

    public async execute(args: Types.ActionArguments): Promise<void> {
        const peer: Contracts.P2P.Peer = args.peer;
        const options: Contracts.P2P.AcceptNewPeerOptions = args.options;

        return this.app.get<PeerProcessor>(Container.Identifiers.PeerProcessor).validateAndAcceptPeer(peer, options);
    }
}
