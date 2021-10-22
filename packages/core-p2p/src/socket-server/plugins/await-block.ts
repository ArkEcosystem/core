import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Server } from "@hapi/hapi";

import { InternalRoute } from "../routes/internal";

@Container.injectable()
export class AwaitBlockPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public register(server: Server): void {
        const peerRoutesConfigByPath = this.app.resolve(InternalRoute).getRoutesConfigByPath();

        server.ext({
            type: "onPreAuth",
            method: async (request, h) => {
                if (peerRoutesConfigByPath[request.path]) {
                    return h.continue;
                }

                if (this.stateStore.getBlockchain().value !== "newBlock") {
                    return h.continue;
                }

                const queue = this.blockchain.getQueue();
                if (!queue.isRunning()) {
                    return h.continue;
                }

                await new Promise<void>((resolve) => {
                    queue.once("drain", () => {
                        resolve();
                    });
                });

                return h.continue;
            },
        });
    }
}
