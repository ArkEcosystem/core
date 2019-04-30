import Hapi from "@hapi/hapi";
import { registerMethods } from "./methods";
import { registerRoutes } from "./routes";

export function register(server: Hapi.Server): void {
    registerMethods(server);
    registerRoutes(server);
}
