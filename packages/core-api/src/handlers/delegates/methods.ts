import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const blocksRepository = databaseService.blocksBusinessRepository;

const index = async request => {
    const delegates = databaseService.wallets.search(Database.SearchScope.Delegates, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(delegates, "delegate");
};

const show = async request => {
    const delegate = databaseService.wallets.findById(Database.SearchScope.Delegates, request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    return respondWithResource(delegate, "delegate");
};

const search = async request => {
    const delegates = databaseService.wallets.search(Database.SearchScope.Delegates, {
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(delegates, "delegate");
};

const blocks = async request => {
    const delegate = databaseService.wallets.findById(Database.SearchScope.Delegates, request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const rows = await blocksRepository.findAllByGenerator(delegate.publicKey, paginate(request));

    return toPagination(rows, "block", request.query.transform);
};

const voters = async request => {
    const delegate = databaseService.wallets.findById(Database.SearchScope.Delegates, request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const wallets = databaseService.wallets.search(Database.SearchScope.Wallets, {
        ...request.query,
        ...{ vote: delegate.publicKey },
        ...paginate(request),
    });

    return toPagination(wallets, "wallet");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.delegates.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.delegates.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.delegates.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.delegates.blocks", blocks, 8, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.delegates.voters", voters, 8, request => ({
            ...{ id: request.params.id },
            ...paginate(request),
        }));
};
