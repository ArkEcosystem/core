import { Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { registerRoutes } from "./routes";

export const register = (app: Contracts.Kernel.Application, server: Hapi.Server): void => {
    registerRoutes(server);
};
