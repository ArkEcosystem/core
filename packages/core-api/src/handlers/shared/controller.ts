import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import Hapi from "hapi";
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

    protected respondWithResource(data, transformer): any {
        return respondWithResource(data, transformer);
    }

    protected respondWithCollection(data, transformer): object {
        return respondWithCollection(data, transformer);
    }

    protected respondWithCache(data, h) {
        return respondWithCache(data, h);
    }

    protected toResource(data, transformer): object {
        return toResource(data, transformer);
    }

    protected toCollection(data, transformer): object {
        return toCollection(data, transformer);
    }

    protected toPagination(data, transformer): object {
        return toPagination(data, transformer);
    }
}
