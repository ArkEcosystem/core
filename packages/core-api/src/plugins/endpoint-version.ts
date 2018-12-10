import Boom from "boom";
import Hapi from "hapi";

const versionRegex = /^\/api\/v([0-9])\//;

const register = async (server: Hapi.Server, options: any): Promise<void> => {
    server.ext({
        type: "onRequest",
        async method(request, h) {
            const match = versionRegex.exec(request.path);

            if (match && match.length === 2) {
                const apiVersion = parseInt(match[1], 10);

                if (!options.validVersions.includes(apiVersion)) {
                    return Boom.badRequest(`Invalid api-version! Valid values: ${options.validVersions.join()}`);
                }

                request.pre.apiVersion = apiVersion;
            }

            return h.continue;
        },
    });
};

export = {
    register,
    name: "endpoint-version",
    version: "1.0.0",
};
