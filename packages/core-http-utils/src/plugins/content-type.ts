export const contentType = {
    name: "content-type",
    version: "0.1.0",
    register(server, options) {
        server.ext({
            type: "onPreHandler",
            async method(request, h) {
                request.headers["content-type"] = "application/json";

                return h.continue;
            },
        });
    },
};
