import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { InternalRoute } from "../routes/internal";

@Container.injectable()
export class WhitelistForgerPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    public register(server) {
        const peerRoutesConfigByPath = this.app.resolve(InternalRoute).getRoutesConfigByPath();
        const peerProcessor = this.peerProcessor;

        server.ext({
            type: "onPreAuth",
            async method(request, h) {
                if (peerRoutesConfigByPath[request.path]) {
                    if (peerProcessor.isWhitelisted({ ip: request.info.remoteAddress } as Contracts.P2P.Peer)) {
                        return h.continue;
                    } else {
                        return Boom.forbidden("IP unauthorized on internal route");
                    }
                } else {
                    return h.continue;
                }
            },
        });
    }
}
