import Hapi from "hapi";
import Routes from "./routes";

export function register(server: Hapi.Server): void {
  Routes(server);
}
