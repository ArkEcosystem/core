import { app } from "@arkecosystem/core-container";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const database = app.resolvePlugin("database");

const index = async request => {
    const { count, rows } = await database.delegates.paginate({
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

    const delegate = await database.delegates.findById(request.query.publicKey || request.query.username);

    if (!delegate) {
        return respondWith("Delegate not found", true);
    }

    return respondWith({
        delegate: toResource(request, delegate, "delegate"),
    });
};

const countDelegates = async request => {
    const delegate = await database.delegates.findAll();

    return respondWith({ count: delegate.count });
};

const search = async request => {
    const { rows } = await database.delegates.search({
        ...{ username: request.query.q },
        ...paginate(request),
    });

    return respondWith({
        delegates: toCollection(request, rows, "delegate"),
    });
};

const voters = async request => {
    const delegate = await database.delegates.findById(request.query.publicKey);

    if (!delegate) {
        return respondWith({
            accounts: [],
        });
    }

    const accounts = await database.wallets.findAllByVote(delegate.publicKey);

    return respondWith({
        accounts: toCollection(request, accounts.rows, "voter"),
    });
};

export function registerMethods(server) {
    server.method("v1.delegates.index", index, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request =>
            generateCacheKey({
                ...request.query,
                ...{
                    offset: request.query.offset || 0,
                    limit: request.query.limit || 51,
                },
            }),
    });

    server.method("v1.delegates.show", show, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request =>
            generateCacheKey({
                id: request.query.publicKey || request.query.username,
            }),
    });

    server.method("v1.delegates.count", countDelegates, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request => generateCacheKey({ time: +new Date() }),
    });

    server.method("v1.delegates.search", search, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request =>
            generateCacheKey({
                ...{ username: request.query.q },
                ...paginate(request),
            }),
    });

    server.method("v1.delegates.voters", voters, {
        cache: {
            expiresIn: 8 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request => generateCacheKey({ id: request.query.publicKey }),
    });
}
