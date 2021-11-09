import Hapi from "@hapi/hapi";
import { Container } from "@packages/core-kernel";

@Container.injectable()
export class EchoController {
    public index(request: Hapi.Request): { query: Hapi.RequestQuery; payload: Hapi.RequestPayload } {
        return { query: request.query, payload: request.payload };
    }
}
