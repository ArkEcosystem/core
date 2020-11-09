import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

@Container.injectable()
export class IsAppReadyPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    public register(server) {
        server.ext({
            type: "onPreHandler",
            method: async (request, h) => {
                if (
                    this.app.isBound(Container.Identifiers.BlockchainService) &&
                    this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService).isBooted()
                ) {
                    return h.continue;
                }
                
                return Boom.forbidden("App is not ready");
            },
        });
    }
}
