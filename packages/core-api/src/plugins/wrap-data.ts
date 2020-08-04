import Hapi from "@hapi/hapi";

export const wrapData = {
    name: "wrapdata",
    version: "0.1.0",
    register(server: Hapi.Server): void {
        server.ext("onPreResponse", (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            if (!request.route.settings.plugins.wrapData?.enabled) {
                return h.continue;
            }

            if (request.response.isBoom) {
                return h.continue;
            }

            return { data: request.response };
        });
    },
};
