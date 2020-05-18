import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { InternalRoute } from "../routes/internal";
import { PeerRoute } from "../routes/peer";

@Container.injectable()
export class ValidatePlugin {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    public register(server) {
        const allRoutesConfigByPath = {
            ...this.app.resolve(InternalRoute).getRoutesConfigByPath(),
            ...this.app.resolve(PeerRoute).getRoutesConfigByPath(),
        };

        server.ext({
            type: "onPostAuth",
            async method(request, h) {
                const result = allRoutesConfigByPath[request.path]?.validation?.validate(request.payload);
                if (result && result.error) {
                    return Boom.badRequest("Validation failed");
                }
                return h.continue;
            },
        });
    }
}
