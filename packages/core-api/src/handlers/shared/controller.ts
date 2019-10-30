import { app, Container, Contracts, Services } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
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

// todo: remove this class and expose helpers as functions
export class Controller {
    // todo: remove
    protected readonly config = Managers.configManager;
    // todo: inject from container
    protected readonly configRepository = app.get<Services.Config.ConfigRepository>(
        Container.Identifiers.ConfigRepository,
    );
    // todo: inject from container
    protected readonly blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
    // todo: inject from container
    protected readonly databaseService = app.get<Contracts.Database.DatabaseService>(
        Container.Identifiers.DatabaseService,
    );

    protected paginate(request: Hapi.Request): any {
        // @ts-ignore
        return paginate(request);
    }

    protected respondWithResource(data, transformer, transform = true): any {
        return respondWithResource(data, transformer, transform);
    }

    protected respondWithCollection(data, transformer, transform = true): object {
        return respondWithCollection(data, transformer, transform);
    }

    protected respondWithCache(data, h) {
        return respondWithCache(data, h);
    }

    protected toResource(data, transformer, transform = true): object {
        return toResource(data, transformer, transform);
    }

    protected toCollection(data, transformer, transform = true): object {
        return toCollection(data, transformer, transform);
    }

    protected toPagination(data, transformer, transform = true): object {
        return toPagination(data, transformer, transform);
    }
}
