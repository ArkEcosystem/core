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
    const lock = databaseService.wallets.search(Database.SearchScope.Locks, {
        lockId: request.params.id,
    }).rows[0];

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

const unlocked = async request => {
    const transactions = await databaseService.transactionsBusinessRepository.findByHtlcLocks(request.payload.ids);

    return toPagination(
        {
            count: transactions.length,
            rows: transactions,
        },
        "transaction",
    );
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
        }))
        .method("v2.locks.unlocked", unlocked, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
