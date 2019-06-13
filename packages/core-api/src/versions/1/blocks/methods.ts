import { blocksRepository } from "../../../repositories";
import { ServerCache } from "../../../services";
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

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v1.blocks.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v1.blocks.show", show, 600, request => ({ id: request.query.id }));
};
