import Hapi from "@hapi/hapi";

export const semaphore = {
    name: "onPreHandler",
    version: "1.0.0",
    register(server: Hapi.Server, options: {}): void {
        server.ext("onPreHandler", (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
            console.log("semaphore");

            return h.continue;
        });
    },
};
