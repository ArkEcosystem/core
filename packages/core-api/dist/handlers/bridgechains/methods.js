"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_interfaces_1 = require("@arkecosystem/core-interfaces");
const services_1 = require("../../services");
const utils_1 = require("../utils");
const databaseService = core_container_1.app.resolvePlugin("database");
const index = async (request) => {
    const bridgechains = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Bridgechains, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(bridgechains, "bridgechain");
};
const search = async (request) => {
    const bridgechains = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Bridgechains, {
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(bridgechains, "bridgechain");
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.bridgechains.index", index, 8, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.bridgechains.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map