import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class VotesController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.votes.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.votes.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
