import { Container, Contracts } from "@arkecosystem/core-kernel";

import { getPeerIp } from "../../utils/get-peer-ip";
import { BlocksRoute } from "../routes/blocks";
import { PeerRoute } from "../routes/peer";
import { TransactionsRoute } from "../routes/transactions";

@Container.injectable()
export class AcceptPeerPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    public register(server) {
        // try to add peer when receiving request on all routes except internal
        const routesConfigByPath = {
            ...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
            ...this.app.resolve(BlocksRoute).getRoutesConfigByPath(),
            ...this.app.resolve(TransactionsRoute).getRoutesConfigByPath(),
        };
        const peerProcessor = this.peerProcessor;

        server.ext({
            type: "onPreHandler",
            async method(request, h) {
                if (routesConfigByPath[request.path]) {
                    const peerIp = request.socket ? getPeerIp(request.socket) : request.info.remoteAddress;
                    peerProcessor.validateAndAcceptPeer({
                        ip: peerIp,
                    } as Contracts.P2P.Peer);
                }
                return h.continue;
            },
        });
    }
}
