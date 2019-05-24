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
        // @ts-ignore
        return paginate(request);
    }

    protected respondWithResource(data, transformer, transform: boolean = true): any {
        return respondWithResource(data, transformer, transform);
    }

    protected respondWithCollection(data, transformer, transform: boolean = true): object {
        return respondWithCollection(data, transformer, transform);
    }

    protected respondWithCache(data, h) {
        return respondWithCache(data, h);
    }

    protected toResource(data, transformer, transform: boolean = true): object {
        return toResource(data, transformer, transform);
    }

    protected toCollection(data, transformer, transform: boolean = true): object {
        return toCollection(data, transformer, transform);
    }

    protected toPagination(data, transformer, transform: boolean = true): object {
        return toPagination(data, transformer, transform);
    }
}
