import Boom from "@hapi/boom";

export const contentType = {
    name: "content-type",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onPreHandler",
            async method(request, h) {
                const header: string = request.headers["content-type"];

                if (header && header !== "application/json") {
                    return Boom.unsupportedMediaType();
                } else {
                    request.headers["content-type"] = "application/json";
                }

                return h.continue;
            },
        });
    },
};
