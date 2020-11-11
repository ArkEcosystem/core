import { Container, Contracts } from "@arkecosystem/core-kernel";

import { PeerRoute } from "../routes/peer";
import { getPeerIp } from "../../utils/get-peer-ip";

@Container.injectable()
export class AcceptPeerPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    public register(server) {
        const peerRoutesConfigByPath = this.app.resolve(PeerRoute).getRoutesConfigByPath();
        const peerProcessor = this.peerProcessor;

        server.ext({
            type: "onPreHandler",
            async method(request, h) {
                if (peerRoutesConfigByPath[request.path]) {
                    const peerIp = request.socket ? getPeerIp(request.socket) : request.info.remoteAddress;
                    peerProcessor.validateAndAcceptPeer({ ip: peerIp } as Contracts.P2P.Peer);
                }
                return h.continue;
            },
        });
    }
}
