"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const boom_1 = __importDefault(require("@hapi/boom"));
const services_1 = require("../../services");
const utils_1 = require("../utils");
const transactionsRepository = core_container_1.app.resolvePlugin("database").transactionsBusinessRepository;
const index = async (request) => {
    const transactions = await transactionsRepository.search({
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(transactions, "transaction", request.query.transform);
};
const show = async (request) => {
    const transaction = await transactionsRepository.findById(request.params.id);
    if (!transaction) {
        return boom_1.default.notFound("Transaction not found");
    }
    return utils_1.respondWithResource(transaction, "transaction", request.query.transform);
};
const search = async (request) => {
    const transactions = await transactionsRepository.search({
        ...request.query,
        ...request.payload,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(transactions, "transaction", request.query.transform);
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.transactions.index", index, 8, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.transactions.show", show, 8, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.transactions.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map