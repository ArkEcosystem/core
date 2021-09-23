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
const blocksRepository = databaseService.blocksBusinessRepository;
const index = async (request) => {
    const delegates = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Delegates, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(delegates, "delegate");
};
const show = async (request) => {
    const delegate = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Delegates, request.params.id);
    if (!delegate) {
        return boom_1.default.notFound("Delegate not found");
    }
    return utils_1.respondWithResource(delegate, "delegate");
};
const search = async (request) => {
    const delegates = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Delegates, {
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(delegates, "delegate");
};
const blocks = async (request) => {
    const delegate = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Delegates, request.params.id);
    if (!delegate) {
        return boom_1.default.notFound("Delegate not found");
    }
    const rows = await blocksRepository.findAllByGenerator(delegate.publicKey, utils_1.paginate(request));
    return utils_1.toPagination(rows, "block", request.query.transform);
};
const voters = async (request) => {
    const delegate = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Delegates, request.params.id);
    if (!delegate) {
        return boom_1.default.notFound("Delegate not found");
    }
    const wallets = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Wallets, {
        ...request.query,
        ...{ vote: delegate.publicKey },
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(wallets, "wallet");
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.delegates.index", index, 8, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.delegates.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.delegates.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.delegates.blocks", blocks, 8, request => ({
        ...{ id: request.params.id },
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.delegates.voters", voters, 8, request => ({
        ...{ id: request.params.id },
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map