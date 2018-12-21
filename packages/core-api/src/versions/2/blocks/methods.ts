import Boom from "boom";
import { blocksRepository, transactionsRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWithResource, toPagination } from "../utils";

const index = async request => {
    const blocks = await blocksRepository.findAll({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, blocks, "block");
};

const show = async request => {
    const block = await blocksRepository.findById(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    return respondWithResource(request, block, "block");
};

const transactions = async request => {
    const block = await blocksRepository.findById(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    const rows = await transactionsRepository.findAllByBlock(block.id, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, rows, "transaction");
};

const search = async request => {
    const blocks = await blocksRepository.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, blocks, "block");
};

export function registerMethods(server) {
    const cacheDisabled = !server.app.config.cache.enabled;

    server.method(
        "v2.blocks.index",
        index,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 6 * 1000,
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
        "v2.blocks.show",
        show,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 600 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request => generateCacheKey({ id: request.params.id }),
              },
    );

    server.method(
        "v2.blocks.transactions",
        transactions,
        cacheDisabled
            ? {}
            : {
                  cache: {
                      expiresIn: 600 * 1000,
                      generateTimeout: getCacheTimeout(),
                      getDecoratedValue: true,
                  },
                  generateKey: request =>
                      generateCacheKey({
                          ...{ id: request.params.id },
                          ...request.query,
                          ...paginate(request),
                      }),
              },
    );

    server.method(
        "v2.blocks.search",
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
}
