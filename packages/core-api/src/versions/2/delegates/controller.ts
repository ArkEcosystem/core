import { app } from "@arkecosystem/core-container";
import Boom from "boom";
import Hapi from "hapi";
import orderBy from "lodash/orderBy";
import { blocksRepository, transactionsRepository } from "../../../repositories";
import { Controller } from "../shared/controller";

export class DelegatesController extends Controller {
    protected database: any;

    public constructor() {
        super();

        this.database = app.resolvePlugin("database");
    }

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.search(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.blocks(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.voters(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async voterBalances(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const data = await request.server.methods.v2.delegates.voterBalances(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
