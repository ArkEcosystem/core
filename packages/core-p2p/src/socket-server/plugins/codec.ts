import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { BlocksRoute } from "../routes/blocks";
import { InternalRoute } from "../routes/internal";
import { PeerRoute } from "../routes/peer";
import { TransactionsRoute } from "../routes/transactions";

@Container.injectable()
export class CodecPlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    public register(server) {
        const allRoutesConfigByPath = {
            ...this.app.resolve(InternalRoute).getRoutesConfigByPath(),
            ...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
            ...this.app.resolve(BlocksRoute).getRoutesConfigByPath(),
            ...this.app.resolve(TransactionsRoute).getRoutesConfigByPath(),
        };

        server.ext({
            type: "onPostAuth",
            async method(request, h) {
                try {
                    request.payload = allRoutesConfigByPath[request.path].codec.request.deserialize(request.payload);
                } catch (e) {
                    return Boom.badRequest(`Payload deserializing failed: ${e}`);
                }
                return h.continue;
            },
        });

        server.ext({
            type: "onPreResponse",
            method: async (request, h) => {
                try {
                    if (typeof request.response.source !== "undefined") {
                        request.response.source = allRoutesConfigByPath[request.path].codec.response.serialize(request.response.source);
                    } else {
                        // if we're here it's because there was some error thrown, error description is in request.response.output.payload
                        // as response payload needs to be Buffer, we convert error message to Buffer
                        const errorMessage = request.response.output?.payload?.message ?? request.response.output?.payload?.error ?? "Error";
                        request.response.output.payload = Buffer.from(errorMessage, "utf-8");
                    }
                } catch (e) {
                    request.response.statusCode = 500; // Internal server error (serializing failed)
                    request.response.output = {
                        statusCode: 500,
                        payload: Buffer.from("Internal server error"),
                        headers: {},
                    };

                    this.logger.error(`Response serializing failed: ${e}`);
                }
                return h.continue;
            },
        });
    }
}
