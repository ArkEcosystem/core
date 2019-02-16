import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const blocksRepository = databaseService.blocks;
const transactionsRepository = databaseService.transactions;

const index = async request => {
    const blocks = await blocksRepository.findAll({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, blocks, "block");
};

const show = async request => {
    const block = await blocksRepository.findById(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    return respondWithResource(request, block, "block");
};

const transactions = async request => {
    const block = await blocksRepository.findById(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    const rows = await transactionsRepository.findAllByBlock(block.id, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, rows, "transaction");
};

const search = async request => {
    const blocks = await blocksRepository.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, blocks, "block");
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v2.blocks.index", index, 6, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.blocks.show", show, 600, request => ({ id: request.params.id }))
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
}
