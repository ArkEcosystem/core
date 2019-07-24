import { app } from "@arkecosystem/core-container";
import { Blockchain, State } from "@arkecosystem/core-interfaces";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class BlocksController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.blocks.index(request);

        return super.respondWithCache(data, h);
    }

    public async first(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return super.respondWithResource(
            app
                .resolvePlugin<State.IStateService>("state")
                .getStore()
                .getGenesisBlock().data,
            "block",
            (request.query.transform as unknown) as boolean,
        );
    }

    public async last(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return super.respondWithResource(
            app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data,
            "block",
            (request.query.transform as unknown) as boolean,
        );
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.blocks.show(request);

        return super.respondWithCache(data, h);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.blocks.transactions(request);

        return super.respondWithCache(data, h);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.blocks.search(request);

        return super.respondWithCache(data, h);
    }
}
