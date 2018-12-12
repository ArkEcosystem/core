import { index } from "./handler";

export const routes = {
    name: "routes",
    version: "0.1.0",
    async register(server, options) {
        server.route([
            {
                method: "POST",
                path: "/",
                ...index,
            },
        ]);
    },
};
