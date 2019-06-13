import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import Hapi from "@hapi/hapi";
import {
    paginate,
    respondWithCache,
    respondWithCollection,
    respondWithResource,
    toCollection,
    toPagination,
    toResource,
} from "../utils";

export class Controller {
    protected readonly config = app.getConfig();
    protected readonly blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    protected readonly databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    protected paginate(request: Hapi.Request): any {
        return paginate(request);
    }

    protected respondWithResource(request, data, transformer): any {
        return respondWithResource(request, data, transformer);
    }

    protected respondWithCollection(request, data, transformer): object {
        return respondWithCollection(request, data, transformer);
    }

    protected respondWithCache(data, h) {
        return respondWithCache(data, h);
    }

    protected toResource(request, data, transformer): object {
        return toResource(request, data, transformer);
    }

    protected toCollection(request, data, transformer): object {
        return toCollection(request, data, transformer);
    }

    protected toPagination(request, data, transformer): object {
        return toPagination(request, data, transformer);
    }
}
