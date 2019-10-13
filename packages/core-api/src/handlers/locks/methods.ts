import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const index = async request => {
    const locks = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Locks, {
            ...request.query,
            ...paginate(request),
        });

    return toPagination(locks, "lock");
};

const show = async request => {
    const lock = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Locks, {
            lockId: request.params.id,
        }).rows[0];

    if (!lock) {
        return Boom.notFound("Lock not found");
    }

    return respondWithResource(lock, "lock");
};

const search = async request => {
    const locks = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Locks, {
            ...request.payload,
            ...request.query,
            ...paginate(request),
        });

    return toPagination(locks, "lock");
};

const unlocked = async request => {
    const transactions = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.findByHtlcLocks(request.payload.ids);

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
