import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";

export const registerMethods = (app: Contracts.Kernel.Application, server) => {
    // todo: rework to make use of injection rather then manual resolving
    const index = async request => {
        const blocks = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .blocksBusinessRepository.search({
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(blocks, "block", request.query.transform);
    };

    const show = async request => {
        const block = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .blocksBusinessRepository.findByIdOrHeight(request.params.id);

        if (!block) {
            return Boom.notFound("Block not found");
        }

        return server.app.utils.respondWithResource(block, "block", request.query.transform);
    };

    const transactions = async request => {
        const block = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .blocksBusinessRepository.findByIdOrHeight(request.params.id);

        if (!block || !block.id) {
            return Boom.notFound("Block not found");
        }

        const rows = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .transactionsBusinessRepository.findAllByBlock(block.id, {
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(rows, "transaction", request.query.transform);
    };

    const search = async request => {
        const blocks = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .blocksBusinessRepository.search({
                ...request.payload,
                ...request.query,
                ...server.app.utils.paginate(request),
            });

        return server.app.utils.toPagination(blocks, "block", request.query.transform);
    };

    app.resolve<ServerCache>(ServerCache)
        .make(server)
        .method("v2.blocks.index", index, 6, request => ({
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.blocks.show", show, 600, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.blocks.transactions", transactions, 600, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...server.app.utils.paginate(request),
        }))
        .method("v2.blocks.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...server.app.utils.paginate(request),
        }));
};
