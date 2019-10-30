import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const findWallet = (id: string): Contracts.State.Wallet | Boom<null> => {
    let wallet: Contracts.State.Wallet | undefined;

    try {
        wallet = app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .wallets.findById(Contracts.Database.SearchScope.Wallets, id);
    } catch (error) {
        return Boom.notFound("Wallet not found");
    }

    return wallet;
};

// todo: rework to make use of injection rather then manual resolving
const index = async request => {
    const wallets = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Wallets, {
            ...request.query,
            ...paginate(request),
        });

    return toPagination(wallets, "wallet");
};

const top = async request => {
    const wallets = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.top(Contracts.Database.SearchScope.Wallets, paginate(request));

    return toPagination(wallets, "wallet");
};

const show = async request => respondWithResource(findWallet(request.params.id), "wallet");

const transactions = async request => {
    const wallet: Contracts.State.Wallet | Boom<null> = findWallet(request.params.id);

    if (wallet instanceof Boom) {
        return wallet;
    }

    // Overwrite parameters for special wallet treatment inside transaction repository
    const parameters = {
        ...request.query,
        ...request.params,
        ...paginate(request),
        walletPublicKey: wallet.publicKey,
        walletAddress: wallet.address,
    };

    delete parameters.publicKey;
    delete parameters.recipientId;
    delete parameters.id;

    const rows = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.search(parameters);

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const transactionsSent = async request => {
    const wallet: Contracts.State.Wallet | Boom<null> = findWallet(request.params.id);

    if (wallet instanceof Boom) {
        return wallet;
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.findAllBySender(wallet.publicKey!, {
            ...request.query,
            ...request.params,
            ...paginate(request),
        });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const transactionsReceived = async request => {
    const wallet: Contracts.State.Wallet | Boom<null> = findWallet(request.params.id);

    if (wallet instanceof Boom) {
        return wallet;
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.findAllByRecipient(wallet.address, {
            ...request.query,
            ...request.params,
            ...paginate(request),
        });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const votes = async request => {
    const wallet: Contracts.State.Wallet | Boom<null> = findWallet(request.params.id);

    if (wallet instanceof Boom) {
        return wallet;
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .transactionsBusinessRepository.allVotesBySender(wallet.publicKey!, {
            ...request.params,
            ...paginate(request),
        });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const locks = async request => {
    const wallet: Contracts.State.Wallet | Boom<null> = findWallet(request.params.id);

    if (wallet instanceof Boom) {
        return wallet;
    }

    // Sorry, cold wallets
    if (!wallet.publicKey) {
        return toPagination({ rows: [], count: 0 }, "lock");
    }

    const rows = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Locks, {
            ...request.params,
            ...request.query,
            ...paginate(request),
            senderPublicKey: wallet.publicKey,
        });

    return toPagination(rows, "lock");
};

const search = async request => {
    const wallets = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .wallets.search(Contracts.Database.SearchScope.Wallets, {
            ...request.payload,
            ...request.query,
            ...paginate(request),
        });

    return toPagination(wallets, "wallet");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.wallets.index", index, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.wallets.top", top, 30, request => paginate(request))
        .method("v2.wallets.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.wallets.transactions", transactions, 30, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...request.params,
            ...paginate(request),
        }))
        .method("v2.wallets.transactionsSent", transactionsSent, 30, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...request.params,
            ...paginate(request),
        }))
        .method("v2.wallets.transactionsReceived", transactionsReceived, 30, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...request.params,
            ...paginate(request),
        }))
        .method("v2.wallets.votes", votes, 30, request => ({
            ...{ id: request.params.id },
            ...request.params,
            ...paginate(request),
        }))
        .method("v2.wallets.locks", locks, 30, request => ({
            ...{ id: request.params.id },
            ...request.params,
            ...paginate(request),
        }))
        .method("v2.wallets.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
