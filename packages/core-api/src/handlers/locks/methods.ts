import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";

export const registerMethods = (app: Contracts.Kernel.Application, server) => {
    const index = async request => {
        const locks = app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .wallets.search(Contracts.Database.SearchScope.Locks, {
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(locks, "lock");
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

        return server.app.utils.respondWithResource(lock, "lock");
    };

    const search = async request => {
        const locks = app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .wallets.search(Contracts.Database.SearchScope.Locks, {
                ...request.payload,
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(locks, "lock");
    };

    const unlocked = async request => {
        const transactions = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.findByHtlcLocks(request.payload.ids);

        return server.app.utils.toPagination(
            {
                count: transactions.length,
                rows: transactions,
            },
            "transaction",
        );
    };

    app.resolve<ServerCache>(ServerCache)
        .make(server)
        .method("v2.locks.index", index, 8, request => ({
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.locks.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.locks.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.locks.unlocked", unlocked, 30, request => ({
            ...request.payload,
            ...request.query,
            ...server.app.utils.paginate(request),
        }));
};
