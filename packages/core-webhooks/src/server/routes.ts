import * as handler from "./handler";

exports.plugin = {
  name: "Ark Webhooks API",
  version: "0.1.0",
  async register(server, options) {
    server.route([
      {
        method: "GET",
        path: "/webhooks",
        ...handler.index,
      },
      {
        method: "POST",
        path: "/webhooks",
        ...handler.store,
      },
      {
        method: "GET",
        path: "/webhooks/{id}",
        ...handler.show,
      },
      {
        method: "PUT",
        path: "/webhooks/{id}",
        ...handler.update,
      },
      {
        method: "DELETE",
        path: "/webhooks/{id}",
        ...handler.destroy,
      },
    ]);
  },
};
