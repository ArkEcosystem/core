import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class WalletsController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.index(request);

        return super.respondWithCache(data, h);
    }

    public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.top(request);

        return super.respondWithCache(data, h);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.show(request);

        return super.respondWithCache(data, h);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.transactions(request);

        return super.respondWithCache(data, h);
    }

    public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.transactionsSent(request);

        return super.respondWithCache(data, h);
    }

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.transactionsReceived(request);

        return super.respondWithCache(data, h);
    }

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.votes(request);

        return super.respondWithCache(data, h);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        // @ts-ignore
        const data = await request.server.methods.v2.wallets.search(request);

        return super.respondWithCache(data, h);
    }
}
