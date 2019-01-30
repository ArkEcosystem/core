import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import Boom from "boom";
import orderBy from "lodash/orderBy";
import { blocksRepository } from "../../../repositories";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const database = app.resolve<PostgresConnection>("database");

const index = async request => {
    const delegates = await database.delegates.paginate({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, delegates, "delegate");
};

const show = async request => {
    const delegate = await database.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    return respondWithResource(request, delegate, "delegate");
};

const search = async request => {
    const delegates = await database.delegates.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, delegates, "delegate");
};

const blocks = async request => {
    const delegate = await database.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const rows = await blocksRepository.findAllByGenerator(delegate.publicKey, paginate(request));

    return toPagination(request, rows, "block");
};

const voters = async request => {
    const delegate = await database.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const wallets = await database.wallets.findAllByVote(delegate.publicKey, paginate(request));

    return toPagination(request, wallets, "wallet");
};

const voterBalances = async request => {
    const delegate = await database.delegates.findById(request.params.id);

    if (!delegate) {
        return Boom.notFound("Delegate not found");
    }

    const wallets = await database.wallets.all().filter(wallet => wallet.vote === delegate.publicKey);

    const data = {};
    orderBy(wallets, ["balance"], ["desc"]).forEach(wallet => {
        data[wallet.address] = +wallet.balance.toFixed();
    });

    return { data };
};

export function registerMethods(server) {
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
            ...paginate(request),
        }))
        .method("v2.delegates.voters", voters, 8, request => ({
            ...{ id: request.params.id },
            ...paginate(request),
        }))
        .method("v2.delegates.voterBalances", voterBalances, 8, request => ({ id: request.params.id }));
}
