import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class RoundsController extends Controller {
    public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.rounds.delegates(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
