import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const index = async request => {
    const bridgechains = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Bridgechains, {
            ...request.query,
            ...paginate(request),
        });

    return toPagination(bridgechains, "bridgechain");
};

const show = async request => {
    const bridgechain = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Bridgechains, {
            bridgechainId: request.params.id,
        }).rows[0];

    if (!bridgechain) {
        return Boom.notFound("Bridgechain not found");
    }

    return respondWithResource(bridgechain, "bridgechain");
};

const search = async request => {
    const bridgechains = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Bridgechains, {
            ...request.payload,
            ...request.query,
            ...paginate(request),
        });

    return toPagination(bridgechains, "bridgechain");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.bridgechains.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.bridgechains.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.bridgechains.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
