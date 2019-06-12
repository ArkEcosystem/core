import Boom from "@hapi/boom";

export const contentType = {
    name: "content-type",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onPreHandler",
            async method(request, h) {
                const header = request.headers["content-type"];

                if (header !== "application/json") {
                    return Boom.unsupportedMediaType();
                }

                return h.continue;
            },
        });
    },
};
