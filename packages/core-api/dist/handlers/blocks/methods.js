"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const boom_1 = __importDefault(require("@hapi/boom"));
const services_1 = require("../../services");
const utils_1 = require("../utils");
const databaseService = core_container_1.app.resolvePlugin("database");
const blocksRepository = databaseService.blocksBusinessRepository;
const transactionsRepository = databaseService.transactionsBusinessRepository;
const index = async (request) => {
    const blocks = await blocksRepository.search({
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(blocks, "block", request.query.transform);
};
const show = async (request) => {
    const block = await blocksRepository.findByIdOrHeight(request.params.id);
    if (!block) {
        return boom_1.default.notFound("Block not found");
    }
    return utils_1.respondWithResource(block, "block", request.query.transform);
};
const transactions = async (request) => {
    const block = await blocksRepository.findByIdOrHeight(request.params.id);
    if (!block) {
        return boom_1.default.notFound("Block not found");
    }
    const rows = await transactionsRepository.findAllByBlock(block.id, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(rows, "transaction", request.query.transform);
};
const search = async (request) => {
    const blocks = await blocksRepository.search({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(blocks, "block", request.query.transform);
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.blocks.index", index, 6, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.blocks.show", show, 600, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.blocks.transactions", transactions, 600, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.blocks.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map