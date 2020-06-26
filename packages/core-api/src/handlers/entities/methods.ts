import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const entities = databaseService.wallets.search(Database.SearchScope.Entities, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(entities, "entity");
};

const show = async request => {
    const entity = databaseService.wallets.search(Database.SearchScope.Entities, {
        id: request.params.id,
    }).rows[0];

    if (!entity) {
        return Boom.notFound("Entity not found");
    }

    return respondWithResource(entity, "entity");
};

const search = async request => {
    const entities = databaseService.wallets.search(Database.SearchScope.Entities, {
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(entities, "entity");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.entities.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.entities.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.entities.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
