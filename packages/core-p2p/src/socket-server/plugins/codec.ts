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
                    console.log(`Payload deserializing failed: ${e}`)
                    return Boom.badRequest(`Payload deserializing failed: ${e}`);
                }
                return h.continue;
            },
        });

        server.ext({
            type: "onPreResponse",
            async method(request, h) {
                try {
                    if (request.response.source) {
                        request.response.source = allRoutesConfigByPath[request.path].codec.response.serialize(request.response.source);
                    } else {
                        request.response.source = allRoutesConfigByPath[request.path].codec.response.serialize(request.response.output.payload);
                        request.response.output.payload = allRoutesConfigByPath[request.path].codec.response.serialize(request.response.output.payload);
                    }
                } catch (e) {
                    console.log(`Response serializing failed: ${e}`)
                    return Boom.badRequest(`Response serializing failed: ${e}`);
                }
                return h.continue;
            },
        });
    }
}
