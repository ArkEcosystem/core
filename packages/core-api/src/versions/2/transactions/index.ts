import Hapi from "hapi";
import { registerMethods } from "./methods";
import Routes from "./routes";

export function register(server: Hapi.Server): void {
  registerMethods(server);
  Routes(server);
}
