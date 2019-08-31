import Hapi from "@hapi/hapi";

import { registerRoutes } from "./routes";

export const register = (server: Hapi.Server): void => {
    registerRoutes(server);
};
