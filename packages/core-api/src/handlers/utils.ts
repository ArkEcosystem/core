import { app } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { transformerService } from "../services/transformer";

// todo: review the implementation of all methods

export const paginate = (request: Hapi.Request): any => {
    const pagination = {
        // @ts-ignore
        offset: (request.query.page - 1) * request.query.limit || 0,
        // @ts-ignore
        limit: request.query.limit || 100,
    };

    // @ts-ignore
    if (request.query.offset) {
        // @ts-ignore
        pagination.offset = request.query.offset;
    }

    return pagination;
};

export const respondWithResource = (data, transformer, transform = true): object => {
    return data ? { data: transformerService.toResource(data, transformer, transform) } : Boom.notFound();
};

export const respondWithCollection = (data, transformer, transform = true): object => {
    return {
        data: transformerService.toCollection(data, transformer, transform),
    };
};

export const respondWithCache = (data, h): any => {
    if (!app.get<any>("api.options").get("plugins.cache.enabled")) {
        return data;
    }

    const { value, cached } = data;
    const lastModified = cached ? new Date(cached.stored) : new Date();

    if (value.isBoom) {
        return h.response(value.output.payload).code(value.output.statusCode);
    }

    let arg;

    if (value.results && value.totalCount !== undefined && value.totalCountIsEstimate !== undefined) {
        arg = {
            results: value.results,
            totalCount: value.totalCount,
            response: { meta: { totalCountIsEstimate: value.totalCountIsEstimate } },
        };
    } else {
        arg = value;
    }

    return h.response(arg).header("Last-modified", lastModified.toUTCString());
};

export const toResource = (data, transformer, transform = true): object => {
    return transformerService.toResource(data, transformer, transform);
};

export const toCollection = (data, transformer, transform = true): object => {
    return transformerService.toCollection(data, transformer, transform);
};

export const toPagination = (data, transformer, transform = true): object => {
    return {
        results: transformerService.toCollection(data.rows, transformer, transform),
        totalCount: data.count,
        meta: { totalCountIsEstimate: data.countIsEstimate },
    };
};
