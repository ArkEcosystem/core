import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { transformerService } from "../../services/transformer";

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

export const respondWithResource = (request, data, transformer): any => {
    return data ? { data: transformerService.toResource(request, data, transformer) } : Boom.notFound();
};

export const respondWithCollection = (request, data, transformer): object => {
    return {
        data: transformerService.toCollection(request, data, transformer),
    };
};

export const respondWithCache = (data, h): any => {
    const { value, cached } = data;
    const lastModified = cached ? new Date(cached.stored) : new Date();

    return value.isBoom
        ? h.response(value.output.payload).code(value.output.statusCode)
        : h.response(value).header("Last-modified", lastModified.toUTCString());
};

export const toResource = (request, data, transformer): object => {
    return transformerService.toResource(request, data, transformer);
};

export const toCollection = (request, data, transformer): object => {
    return transformerService.toCollection(request, data, transformer);
};

export const toPagination = (request, data, transformer): object => {
    return {
        results: transformerService.toCollection(request, data.rows, transformer),
        totalCount: data.count,
    };
};
