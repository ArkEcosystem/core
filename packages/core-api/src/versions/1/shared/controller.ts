import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { AbstractLogger } from "@arkecosystem/core-logger";
import Hapi from "hapi";
import { paginate, respondWith, respondWithCache, toCollection, toResource } from "../utils";

export class Controller {
    protected config = app.getConfig();
    protected blockchain = app.resolvePlugin("blockchain");
    protected database = app.resolvePlugin<PostgresConnection>("database");
    protected logger = app.resolvePlugin<AbstractLogger>("logger");

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
