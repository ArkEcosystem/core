import Hapi from "hapi";

export = {
    name: "set-headers",
    version: "1.0.0",
    async register(server: Hapi.Server): Promise<void> {
        server.ext({
            type: "onPreResponse",
            async method(request, h) {
                const response = request.response;

                // @ts-ignore
                if (response.isBoom && response.data) {
                    // Deleting the property beforehand makes it appear last in the response body.
                    // @ts-ignore
                    delete response.output.payload.error;
                    // @ts-ignore
                    response.output = { payload: { error: response.data } };
                }

                return h.continue;
            },
        });
    },
};
