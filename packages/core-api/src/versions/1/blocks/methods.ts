import { blocksRepository } from "../../../repositories";
import { generateCacheKey, getCacheTimeout } from "../../utils";
import { paginate, respondWith, toCollection, toResource } from "../utils";

const index = async request => {
    const { count, rows } = await blocksRepository.findAll({
        ...request.query,
        ...paginate(request),
    });

    if (!rows) {
        return respondWith("No blocks found", true);
    }

    return respondWith({
        blocks: toCollection(request, rows, "block"),
        count,
    });
};

const show = async request => {
    const block = await blocksRepository.findById(request.query.id);

    if (!block) {
        return respondWith(`Block with id ${request.query.id} not found`, true);
    }

    return respondWith({
        block: toResource(request, block, "block"),
    });
};

export function registerMethods(server) {
    server.method("v1.blocks.index", index, {
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
    });

    server.method("v1.blocks.show", show, {
        cache: {
            expiresIn: 600 * 1000,
            generateTimeout: getCacheTimeout(),
            getDecoratedValue: true,
        },
        generateKey: request => generateCacheKey({ id: request.query.id }),
    });
}
