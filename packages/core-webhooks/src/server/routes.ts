import { destroy, index, show, store, update } from "./handler";

export const registerRoutes = {
    name: "Ark Webhooks API",
    version: "0.1.0",
    async register(server, options) {
        server.route([
            {
                method: "GET",
                path: "/webhooks",
                ...index,
            },
            {
                method: "POST",
                path: "/webhooks",
                ...store,
            },
            {
                method: "GET",
                path: "/webhooks/{id}",
                ...show,
            },
            {
                method: "PUT",
                path: "/webhooks/{id}",
                ...update,
            },
            {
                method: "DELETE",
                path: "/webhooks/{id}",
                ...destroy,
            },
        ]);
    },
};
