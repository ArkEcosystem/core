import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { ServerCache } from "../../../services";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const { count, rows } = await databaseService.delegates.findAll({
        ...request.query,
        ...{
            offset: request.query.offset || 0,
            limit: request.query.limit || 51,
        },
    });

    return respondWith({
        delegates: toCollection(request, rows, "delegate"),
        totalCount: count,
    });
};

const show = async request => {
    if (!request.query.publicKey && !request.query.username) {
        return respondWith("Delegate not found", true);
    }

    const delegate = await databaseService.delegates.findById(request.query.publicKey || request.query.username);

    if (!delegate) {
        return respondWith("Delegate not found", true);
    }

    return respondWith({
        delegate: toResource(request, delegate, "delegate"),
    });
};

const countDelegates = async request => {
    const delegate = await databaseService.delegates.findAll();

    return respondWith({ count: delegate.count });
};

const search = async request => {
    const { rows } = await databaseService.delegates.search({
        ...{ username: request.query.q },
        ...paginate(request),
    });

    return respondWith({
        delegates: toCollection(request, rows, "delegate"),
    });
};

const voters = async request => {
    const delegate = await databaseService.delegates.findById(request.query.publicKey);

    if (!delegate) {
        return respondWith({
            accounts: [],
        });
    }

    const accounts = await databaseService.wallets.findAllByVote(delegate.publicKey);

    return respondWith({
        accounts: toCollection(request, accounts.rows, "voter"),
    });
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v1.delegates.index", index, 8, request => ({
            ...request.query,
            ...{
                offset: request.query.offset || 0,
                limit: request.query.limit || 51,
            },
        }))
        .method("v1.delegates.show", show, 8, request => ({
            id: request.query.publicKey || request.query.username,
        }))
        .method("v1.delegates.count", countDelegates, 8, request => ({ time: +new Date() }))
        .method("v1.delegates.search", search, 8, request => ({
            ...{ username: request.query.q },
            ...paginate(request),
        }))
        .method("v1.delegates.voters", voters, 8, request => ({ id: request.query.publicKey }));
}
