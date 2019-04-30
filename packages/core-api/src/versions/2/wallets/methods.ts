import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { transactionsRepository } from "../../../repositories";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const index = async request => {
    const wallets = await databaseService.wallets.findAll({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, wallets, "wallet");
};

const top = async request => {
    const wallets = await databaseService.wallets.top(paginate(request));

    return toPagination(request, wallets, "wallet");
};

const show = async request => {
    const wallet = await databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    return respondWithResource(request, wallet, "wallet");
};

const transactions = async request => {
    const wallet = await databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    const rows = await transactionsRepository.findAllByWallet(wallet, {
        ...request.query,
        ...request.params,
        ...paginate(request),
    });

    return toPagination(request, rows, "transaction");
};

const transactionsSent = async request => {
    const wallet = await databaseService.wallets.findById(request.params.id);

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

    return toPagination(request, rows, "transaction");
};

const transactionsReceived = async request => {
    const wallet = await databaseService.wallets.findById(request.params.id);

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

    return toPagination(request, rows, "transaction");
};

const votes = async request => {
    const wallet = await databaseService.wallets.findById(request.params.id);

    if (!wallet) {
        return Boom.notFound("Wallet not found");
    }

    // NOTE: We unset this value because it otherwise will produce a faulty SQL query
    delete request.params.id;

    const rows = await transactionsRepository.allVotesBySender(wallet.publicKey, {
        ...request.params,
        ...paginate(request),
    });

    return toPagination(request, rows, "transaction");
};

const search = async request => {
    const wallets = await databaseService.wallets.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, wallets, "wallet");
};

export function registerMethods(server) {
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
}
