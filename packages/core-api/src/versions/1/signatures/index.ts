import Hapi from "hapi";
import { registerRoutes } from "./routes";

export function register(server: Hapi.Server): void {
    registerRoutes(server);
}
