import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const locks = databaseService.wallets.search(Database.SearchScope.Locks, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(locks, "lock");
};

const show = async request => {
    const lock = databaseService.wallets.findById(Database.SearchScope.Locks, request.params.id);

    if (!lock) {
        return Boom.notFound("Lock not found");
    }

    return respondWithResource(lock, "lock");
};

const search = async request => {
    const locks = databaseService.wallets.search(Database.SearchScope.Locks, {
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(locks, "lock");
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
