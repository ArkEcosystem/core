import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

export const wrapdata = {
    name: "wrapdata",
    version: "0.1.0",
    register(server: Hapi.Server): void {
        server.ext("onPreResponse", (request, h) => {
            if (!request.route.settings.plugins.wrapdata?.enabled) {
                return h.continue;
            }
            if (request.response.isBoom) {
                return h.continue;
            }

            return { data: request.response };
        });
    },
};
