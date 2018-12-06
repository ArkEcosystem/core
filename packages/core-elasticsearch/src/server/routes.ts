import { index } from "./handler";

const routePlugin = {
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

export { routePlugin };
