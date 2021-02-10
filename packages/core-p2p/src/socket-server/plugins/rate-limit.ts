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

    private readonly endpointByPath: Map<string, string> = new Map<string, string>();

    @Container.postConstruct()
    public initialize(): void {
        const configs = {
            ...this.app.resolve(InternalRoute).getRoutesConfigByPath(),
            ...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
            ...this.app.resolve(BlocksRoute).getRoutesConfigByPath(),
            ...this.app.resolve(TransactionsRoute).getRoutesConfigByPath(),
        };

        for (const [path, config] of Object.entries(configs)) {
            this.endpointByPath.set(path, config.id);
        }
    }

    public register(server) {
        server.ext({ type: "onPreAuth", method: this.onPreAuth.bind(this) });
    }

    public async onPreAuth(request, h) {
        const endpoint: string | undefined = this.endpointByPath.get(request.path);

        if (await this.rateLimiter.consumeIncoming(request.info.remoteAddress, endpoint)) {
            return h.continue;
        } else {
            return Boom.tooManyRequests("Rate limit exceeded");
        }
    }
}
