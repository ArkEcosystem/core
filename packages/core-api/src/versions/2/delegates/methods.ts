import { app } from "@arkecosystem/core-container";
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import Boom from "boom";
import orderBy from "lodash/orderBy";
import { blocksRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWithResource, toPagination } from "../utils";

const database = app.resolvePlugin<PostgresConnection>("database");

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
    const cacheDisabled = !server.app.config.cache.enabled;

    server.method(
        "v2.delegates.index",
        index,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...request.query,
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v2.delegates.show",
        show,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ id: request.params.id }),
              },
    );

    server.method(
        "v2.delegates.search",
        search,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 30 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...request.payload,
                          ...request.query,
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v2.delegates.blocks",
        blocks,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...{ id: request.params.id },
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v2.delegates.voters",
        voters,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...{ id: request.params.id },
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v2.delegates.voterBalances",
        voterBalances,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 8 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ id: request.params.id }),
              },
    );
}
