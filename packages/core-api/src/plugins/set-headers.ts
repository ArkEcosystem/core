import Hapi from "@hapi/hapi";

// todo: review the implementation - still needed?
export = {
    name: "set-headers",
    version: "1.0.0",
    async register(server: Hapi.Server): Promise<void> {
        server.ext({
            type: "onPreResponse",
            async method(request, h) {
                const response = request.response;

                if (response.isBoom && response.data) {
                    delete response.output.payload.error;

                    response.output = { payload: { error: response.data } };
                }

                return h.continue;
            },
        });
    },
};
