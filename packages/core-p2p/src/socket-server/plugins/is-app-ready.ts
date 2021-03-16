import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { Server } from "@hapi/hapi";

import { protocol } from "../../hapi-nes/utils";

@Container.injectable()
export class IsAppReadyPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    public register(server: Server): void {
        server.ext({
            type: "onPostAuth",
            method: async (request, h) => {
                if (this.blockchain.isBooted()) {
                    return h.continue;
                }

                return Boom.boomify(new Error("App is not ready"), { statusCode: protocol.gracefulErrorStatusCode });
            },
        });
    }
}
