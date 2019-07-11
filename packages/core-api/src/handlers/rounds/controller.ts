import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class RoundsController extends Controller {
    public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.rounds.delegates(request);

        return super.respondWithCache(data, h);
    }
}
