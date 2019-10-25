import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const businesses = databaseService.wallets.search(Database.SearchScope.Businesses, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(businesses, "business");
};

const show = async request => {
    const business = databaseService.wallets.search(Database.SearchScope.Businesses, {
        businessId: request.params.id,
    }).rows[0];

    if (!business) {
        return Boom.notFound("Business not found");
    }

    return respondWithResource(business, "business");
};

const bridgechains = async request => {
    const business = databaseService.wallets.search(Database.SearchScope.Businesses, {
        businessId: request.params.id,
    });

    if (!business) {
        return Boom.notFound("Business not found");
    }

    const bridgechains = databaseService.wallets.search(Database.SearchScope.Bridgechains, {
        businessId: request.params.id,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(bridgechains, "bridgechain");
};

const search = async request => {
    const businesses = databaseService.wallets.search(Database.SearchScope.Businesses, {
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(businesses, "business");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.businesses.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.businesses.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.businesses.bridgechains", bridgechains, 8, request => ({
            id: request.params.id,
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.businesses.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
