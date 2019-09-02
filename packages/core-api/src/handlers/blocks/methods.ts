import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const index = async request => {
    const blocks = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .blocksBusinessRepository.search({
            ...request.query,
            ...paginate(request),
        });

    return toPagination(blocks, "block", request.query.transform);
};

const show = async request => {
    const block = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .blocksBusinessRepository.findByIdOrHeight(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    return respondWithResource(block, "block", request.query.transform);
};

const transactions = async request => {
    const block = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .blocksBusinessRepository.findByIdOrHeight(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    const rows = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.findAllByBlock(block.id, {
            ...request.query,
            ...paginate(request),
        });

    return toPagination(rows, "transaction", request.query.transform);
};

const search = async request => {
    const blocks = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .blocksBusinessRepository.search({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        });

    return toPagination(blocks, "block", request.query.transform);
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.blocks.index", index, 6, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.blocks.show", show, 600, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.blocks.transactions", transactions, 600, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.blocks.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
