import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Controller } from "../shared/controller";

// todo: remove the abstract and use dependency injection if needed
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
