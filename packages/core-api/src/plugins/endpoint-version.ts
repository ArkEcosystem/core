import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

export = {
    name: "endpoint-version",
    version: "1.0.0",
    async register(server: Hapi.Server, options: any): Promise<void> {
        server.ext({
            type: "onRequest",
            async method(request, h) {
                const match = /^\/api\/v([0-9])\//.exec(request.path);

                if (match && match.length === 2) {
                    const apiVersion = parseInt(match[1], 10);

                    if (!options.versions.includes(apiVersion)) {
                        return Boom.badRequest(`Invalid api-version! Valid values: ${options.versions.join()}`);
                    }

                    request.pre.apiVersion = apiVersion;
                }

                return h.continue;
            },
        });
    },
};
