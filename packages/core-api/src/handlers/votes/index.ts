import { Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { registerMethods } from "./methods";
import { registerRoutes } from "./routes";

export const register = (app: Contracts.Kernel.Application, server: Hapi.Server): void => {
    registerMethods(app, server);
    registerRoutes(server);
};
