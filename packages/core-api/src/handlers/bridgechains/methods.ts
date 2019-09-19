import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const bridgechains = databaseService.wallets.search(Database.SearchScope.Bridgechains, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(bridgechains, "bridgechain");
};

const show = async request => {
    const bridgechain = databaseService.wallets.search(Database.SearchScope.Bridgechains, {
        bridgechainId: request.params.id,
    }).rows[0];

    if (!bridgechain) {
        return Boom.notFound("Bridgechain not found");
    }

    return respondWithResource(bridgechain, "bridgechain");
};

const search = async request => {
    const bridgechains = databaseService.wallets.search(Database.SearchScope.Bridgechains, {
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
