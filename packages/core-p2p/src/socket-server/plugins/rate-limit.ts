import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { BlocksRoute } from "../routes/blocks";
import { InternalRoute } from "../routes/internal";
import { PeerRoute } from "../routes/peer";
import { TransactionsRoute } from "../routes/transactions";

@Container.injectable()
export class RateLimitPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PeerRateLimiter)
    private readonly rateLimiter!: Contracts.P2P.PeerRateLimiter;

    public register(server) {
        const allRoutesConfigByPath = {
            ...this.app.resolve(InternalRoute).getRoutesConfigByPath(),
            ...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
            ...this.app.resolve(BlocksRoute).getRoutesConfigByPath(),
            ...this.app.resolve(TransactionsRoute).getRoutesConfigByPath(),
        };

        server.ext({
            type: "onPreAuth",
            method: async (request, h) => {
                const endpoint = allRoutesConfigByPath[request.path].id;

                if (await this.rateLimiter.consumeIncoming(request.info.remoteAddress, endpoint)) {
                    return h.continue;
                } else {
                    return Boom.tooManyRequests("Rate limit exceeded");
                }
            },
        });
    }
}
