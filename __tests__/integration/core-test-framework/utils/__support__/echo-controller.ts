import Hapi from "@hapi/hapi";
import { Container } from "@packages/core-kernel";
import stream from "stream";

@Container.injectable()
export class EchoController {
    public index(request: Hapi.Request): {
        query: Hapi.RequestQuery;
        payload: stream.Readable | Buffer | string | object;
    } {
        return { query: request.query, payload: request.payload };
    }
}
