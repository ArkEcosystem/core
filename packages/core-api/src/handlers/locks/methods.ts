import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const delegates = databaseService.wallets.search(Database.SearchScope.Locks, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(delegates, "lock");
};

const show = async request => {
    const delegate = databaseService.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    return respondWithResource(delegate, "lock");
};

const search = async request => {
    const delegates = databaseService.delegates.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(delegates, "lock");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.locks.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.locks.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.locks.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
