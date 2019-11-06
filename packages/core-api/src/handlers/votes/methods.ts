import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";

const { TransactionType } = Enums;

export const registerMethods = (app: Contracts.Kernel.Application, server) => {
    // todo: rework to make use of injection rather then manual resolving
    const index = async request => {
        const transactions = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.findAllByType(TransactionType.Vote, {
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(transactions, "transaction", (request.query
            .transform as unknown) as boolean);
    };

    const show = async request => {
        const transaction = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.findByTypeAndId(TransactionType.Vote, request.params.id);

        if (!transaction) {
            return Boom.notFound("Vote not found");
        }

        return server.app.utils.respondWithResource(transaction, "transaction", (request.query
            .transform as unknown) as boolean);
    };

    app.resolve<ServerCache>(ServerCache)
        .make(server)
        .method("v2.votes.index", index, 8, request => ({
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.votes.show", show, 8, request => ({ ...{ id: request.params.id }, ...request.query }));
};
