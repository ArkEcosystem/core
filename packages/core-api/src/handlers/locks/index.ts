import Hapi from "@hapi/hapi";

import { registerMethods } from "./methods";
import { registerRoutes } from "./routes";
import { Contracts } from "@arkecosystem/core-kernel";

export const register = (app: Contracts.Kernel.Application, server: Hapi.Server): void => {
    registerMethods(app, server);
    registerRoutes(server);
};
