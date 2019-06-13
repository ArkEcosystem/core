import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger } from "@arkecosystem/core-interfaces";
import Hapi from "@hapi/hapi";
import { paginate, respondWith, respondWithCache, toCollection, toResource } from "../utils";

export class Controller {
    protected readonly config = app.getConfig();
    protected readonly blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    protected readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    protected readonly logger = app.resolvePlugin<Logger.ILogger>("logger");

    protected paginate(request: Hapi.Request): any {
        return paginate(request);
    }

    protected respondWith(data, error = false): object {
        return respondWith(data, error);
    }

    protected respondWithCache(data, h): any {
        return respondWithCache(data, h);
    }

    protected toResource(request, data, transformer): object {
        return toResource(request, data, transformer);
    }

    protected toCollection(request, data, transformer): object {
        return toCollection(request, data, transformer);
    }
}
