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
    const businesses = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Businesses, {
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(businesses, "business");
};
const show = async (request) => {
    let publicKey;
    if (request.params.id.length === 66) {
        publicKey = request.params.id;
    }
    else {
        try {
            publicKey = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id).publicKey;
        }
        catch (error) {
            return boom_1.default.notFound("Business not found");
        }
    }
    const business = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Businesses, {
        publicKey,
        ...request.query,
    }).rows[0];
    if (!business) {
        return boom_1.default.notFound("Business not found");
    }
    return utils_1.respondWithResource(business, "business");
};
const bridgechains = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.id);
    if (!wallet || !wallet.hasAttribute("business")) {
        return boom_1.default.notFound("Business not found");
    }
    const bridgechains = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Bridgechains, {
        publicKey: wallet.publicKey,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(bridgechains, "bridgechain");
};
const bridgechain = async (request) => {
    const wallet = databaseService.wallets.findById(core_interfaces_1.Database.SearchScope.Wallets, request.params.businessId);
    if (!wallet || !wallet.hasAttribute("business")) {
        return boom_1.default.notFound("Business not found");
    }
    const bridgechains = wallet.getAttribute("business.bridgechains");
    if (!bridgechains || !bridgechains[request.params.bridgechainId]) {
        return boom_1.default.notFound("Bridgechain not found");
    }
    return utils_1.respondWithResource(bridgechains[request.params.bridgechainId], "bridgechain");
};
const search = async (request) => {
    const businesses = databaseService.wallets.search(core_interfaces_1.Database.SearchScope.Businesses, {
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    });
    return utils_1.toPagination(businesses, "business");
};
exports.registerMethods = server => {
    services_1.ServerCache.make(server)
        .method("v2.businesses.index", index, 8, request => ({
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.businesses.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.businesses.bridgechains", bridgechains, 8, request => ({
        id: request.params.id,
        ...request.query,
        ...utils_1.paginate(request),
    }))
        .method("v2.businesses.bridgechain", bridgechain, 8, request => ({
        businessId: request.params.businessId,
        bridgechainId: request.params.bridgechainId,
    }))
        .method("v2.businesses.search", search, 30, request => ({
        ...request.payload,
        ...request.query,
        ...utils_1.paginate(request),
    }));
};
//# sourceMappingURL=methods.js.map