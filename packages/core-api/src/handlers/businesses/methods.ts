import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const index = async request => {
    const businesses = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Businesses, {
            ...request.query,
            ...paginate(request),
        });

    return toPagination(businesses, "business");
};

const show = async request => {
    const business = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Businesses, {
            businessId: request.params.id,
        }).rows[0];

    if (!business) {
        return Boom.notFound("Business not found");
    }

    return respondWithResource(business, "business");
};

const search = async request => {
    const businesses = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Businesses, {
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
        .method("v2.businesses.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
