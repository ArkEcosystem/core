import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";
import { Utils } from "../utils";

export const registerMethods = (app: Contracts.Kernel.Application, server) => {
    // todo: rework to make use of injection rather then manual resolving
    const index = async request => {
        const transactions = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.search({
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(
            transactions,
            "transaction",
            (request.query.transform as unknown) as boolean,
        );
    };

    const show = async request => {
        const transaction = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.findById(request.params.id);

        if (!transaction) {
            return Boom.notFound("Transaction not found");
        }

        return app
            .resolve<Utils>(Utils)
            .respondWithResource(transaction, "transaction", (request.query.transform as unknown) as boolean);
    };

    const search = async request => {
        const transactions = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.search({
                ...request.query,
                ...request.payload,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(
            transactions,
            "transaction",
            (request.query.transform as unknown) as boolean,
        );
    };

    app.resolve<ServerCache>(ServerCache)
        .make(server)
        .method("v2.transactions.index", index, 8, request => ({
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.transactions.show", show, 8, request => ({
            ...{
                id: request.params.id,
            },
            ...request.query,
        }))
        .method("v2.transactions.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...server.app.utils.paginate(request),
        }));
};
