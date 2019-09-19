import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class LocksController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.locks.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.locks.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.locks.search(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
