"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const boom_1 = __importDefault(require("@hapi/boom"));
const services_1 = require("../../services");
const utils_1 = require("../utils");
const databaseService = core_container_1.app.resolvePlugin("database");
const transactionsRepository = databaseService.transactionsBusinessRepository;
const index = async (request) => {
    const wallets = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Wallets, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(wallets, "wallet");
};
const top = async (request) => {
    const wallets = databaseService.wallets.top(core_interfaces_1.Database.SearchScope.Wallets, utils_1.paginate(request));
    return utils_1.toPagination(wallets, "wallet");
};
const show = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    return utils_1.respondWithResource(wallet, "wallet");
};
const transactions = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    // Overwrite parameters for special wallet treatment inside transaction repository
    const parameters = {
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
        walletPublicKey: wallet.publicKey,
        walletAddress: wallet.address,
    };
    delete parameters.publicKey;
    delete parameters.recipientId;
    delete parameters.id;
    const rows = await transactionsRepository.search(parameters);
    return utils_1.toPagination(rows, "transaction", request.query.transform);
};
const transactionsSent = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;
    const rows = await transactionsRepository.findAllBySender(wallet.publicKey, {
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(rows, "transaction", request.query.transform);
};
const transactionsReceived = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;
    const rows = await transactionsRepository.findAllByRecipient(wallet.address, {
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(rows, "transaction", request.query.transform);
};
const votes = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;
    const rows = await transactionsRepository.allVotesBySender(wallet.publicKey, {
        ...request.params,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(rows, "transaction", request.query.transform);
};
const locks = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet) {
        return boom_1.default.notFound("Wallet not found");
    }
    // Sorry, cold wallets
    if (!wallet.publicKey) {
        return utils_1.toPagination({ rows: [], count: 0 }, "lock");
    }
    const rows = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Locks, {
        ...request.params,
        ...request.query,
        ...utils_1.paginate(request),
        senderPublicKey: wallet.publicKey,
    });
    return utils_1.toPagination(rows, "lock");
};
const search = async (request) => {
    const wallets = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Wallets, {
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(wallets, "wallet");
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.wallets.index", index, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.top", top, 30, request => utils_1.paginate(request))
        .method("v2.wallets.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.wallets.transactions", transactions, 30, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.transactionsSent", transactionsSent, 30, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.transactionsReceived", transactionsReceived, 30, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.votes", votes, 30, request => ({
        ...{ id: request.params.id },
        ...request.params,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.locks", locks, 30, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...request.params,
        ...utils_1.paginate(request),
    }))
        .method("v2.wallets.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map