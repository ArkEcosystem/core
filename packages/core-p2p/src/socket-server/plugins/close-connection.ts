import { isBoom } from "@hapi/boom";
import { Container, Contracts } from "@arkecosystem/core-kernel";

@Container.injectable()
export class CloseConnectionPlugin {
    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    public register(server) {
        const peerProcessor = this.peerProcessor;

        server.ext({
            type: "onPreResponse",
            async method(request, h) {
                const isWhitelisted: boolean = peerProcessor.isWhitelisted({
                    ip: request.info.remoteAddress,
                } as Contracts.P2P.Peer);

                if (!isWhitelisted && isBoom(request.response)) {
                    return h.response().header("connection", "close").code(request.response.output.statusCode);
                }
                return h.continue;
            },
        });
    }
}
