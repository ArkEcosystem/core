import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { orderBy } from "@arkecosystem/utils";
import Boom from "boom";
import { blocksRepository } from "../../../repositories";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, respondWithCollection, toPagination } from "../utils";

const config = app.getConfig();
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

const index = async request => {
    const delegates = await databaseService.delegates.findAll({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, delegates, "delegate");
};

const active = async request => {
    const delegates = await databaseService.delegates.getActiveAtHeight(
        request.query.height || blockchain.getLastHeight()
    );

    if (!delegates.length) {
        return Boom.notFound("Delegates not found");
    }

    return respondWithCollection(request, delegates, "delegate");
};

const show = async request => {
    const delegate = await databaseService.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    return respondWithResource(request, delegate, "delegate");
};

const search = async request => {
    const delegates = await databaseService.delegates.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, delegates, "delegate");
};

const blocks = async request => {
    const delegate = await databaseService.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const rows = await blocksRepository.findAllByGenerator(delegate.publicKey, paginate(request));

    return toPagination(request, rows, "block");
};

const voters = async request => {
    const delegate = await databaseService.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const wallets = await databaseService.wallets.findAllByVote(delegate.publicKey, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, wallets, "wallet");
};

const voterBalances = async request => {
    const delegate = await databaseService.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const wallets = await databaseService.wallets.all().filter(wallet => wallet.vote === delegate.publicKey);

    const data = {};
    orderBy(wallets, ["balance"], ["desc"]).forEach(wallet => {
        data[wallet.address] = +wallet.balance.toFixed();
    });

    return { data };
};

export function registerMethods(server) {
    const { activeDelegates, blocktime } = config.getMilestone();

    ServerCache.make(server)
        .method("v2.delegates.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.delegates.active", active, activeDelegates * blocktime, request => ({
            ...request.query
        }))
        .method("v2.delegates.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.delegates.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.delegates.blocks", blocks, 8, request => ({
            ...{ id: request.params.id },
            ...paginate(request),
        }))
        .method("v2.delegates.voters", voters, 8, request => ({
            ...{ id: request.params.id },
            ...paginate(request),
        }))
        .method("v2.delegates.voterBalances", voterBalances, 8, request => ({ id: request.params.id }));
}
