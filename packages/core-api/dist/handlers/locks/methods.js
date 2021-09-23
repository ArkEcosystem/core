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
const index = async (request) => {
    const locks = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Locks, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(locks, "lock");
};
const show = async (request) => {
    const lock = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Locks, {
        lockId: request.params.id,
    }).rows[0];
    if (!lock) {
        return boom_1.default.notFound("Lock not found");
    }
    return utils_1.respondWithResource(lock, "lock");
};
const search = async (request) => {
    const locks = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Locks, {
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(locks, "lock");
};
const unlocked = async (request) => {
    const transactions = await databaseService.transactionsBusinessRepository.findByHtlcLocks(request.payload.ids);
    return utils_1.toPagination({
        count: transactions.length,
        rows: transactions,
    }, "transaction");
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.locks.index", index, 8, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.locks.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.locks.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.locks.unlocked", unlocked, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map