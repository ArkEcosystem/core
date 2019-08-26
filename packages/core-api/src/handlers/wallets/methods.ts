import { app, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.ioc.get<Contracts.Database.IDatabaseService>("database");
const transactionsRepository = databaseService.transactionsBusinessRepository;

const index = async request => {
    const wallets = databaseService.wallets.search({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(wallets, "wallet");
};

const top = async request => {
    const wallets = databaseService.wallets.top(paginate(request));

    return toPagination(wallets, "wallet");
};

const show = async request => {
    const wallet = databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    return respondWithResource(wallet, "wallet");
};

const transactions = async request => {
    const wallet = databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    const rows = await transactionsRepository.findAllByWallet(wallet, {
        ...request.query,
        ...request.params,
        ...paginate(request),
    });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const transactionsSent = async request => {
    const wallet = databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await transactionsRepository.findAllBySender(wallet.publicKey, {
        ...request.query,
        ...request.params,
        ...paginate(request),
    });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const transactionsReceived = async request => {
    const wallet = databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await transactionsRepository.findAllByRecipient(wallet.address, {
        ...request.query,
        ...request.params,
        ...paginate(request),
    });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const votes = async request => {
    const wallet = databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await transactionsRepository.allVotesBySender(wallet.publicKey, {
        ...request.params,
        ...paginate(request),
    });

    return toPagination(rows, "transaction", (request.query.transform as unknown) as boolean);
};

const search = async request => {
    const wallets = databaseService.wallets.search({
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
        .method("v2.wallets.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
