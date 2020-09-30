import Hapi from "@hapi/hapi";

export const commaArrayQuery = {
    name: "comma-array-query",
    version: "1.0.0",

    register(server: Hapi.Server): void {
        server.ext("onRequest", this.onRequest);
    },

    onRequest(request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.Lifecycle.ReturnValue {
        const query = {};
        const separator = ",";

        for (const [key, value] of Object.entries(request.query as { [key: string]: string })) {
            query[key] = value.indexOf(separator) > -1 ? value.split(separator) : value;
        }

        request.query = query;
        return h.continue;
    },
};
