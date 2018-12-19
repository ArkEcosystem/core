import { app } from "@arkecosystem/core-container";
import Hapi from "hapi";
import { paginate, respondWith, respondWithCache, toCollection, toResource } from "../utils";

export class Controller {
    protected config: any;
    protected blockchain: any;
    protected database: any;
    protected logger: any;

    public constructor() {
        this.config = app.getConfig();
        this.blockchain = app.resolvePlugin("blockchain");
        this.database = app.resolvePlugin("database");
        this.logger = app.resolvePlugin("logger");
    }

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
