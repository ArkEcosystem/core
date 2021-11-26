import { Utils } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

export const dotSeparatedQuery = {
    name: "dot-separated-query",
    version: "1.0.0",

    register(server: Hapi.Server): void {
        server.ext("onRequest", this.onRequest);
    },

    onRequest(request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.Lifecycle.ReturnValue {
        for (const [key, value] of Object.entries(request.query)) {
            delete request.query[key];
            Utils.set(request.query, key, value);
        }
        return h.continue;
    },
};
