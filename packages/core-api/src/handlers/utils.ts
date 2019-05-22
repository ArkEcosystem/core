import Boom from "boom";
import Hapi from "hapi";
import { transformerService } from "../services/transformer";

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

export const respondWithResource = (data, transformer): object => {
    return data ? { data: transformerService.toResource(data, transformer) } : Boom.notFound();
};

export const respondWithCollection = (data, transformer): object => {
    return {
        data: transformerService.toCollection(data, transformer),
    };
};

export const respondWithCache = (data, h): any => {
    const { value, cached } = data;
    const lastModified = cached ? new Date(cached.stored) : new Date();

    return value.isBoom
        ? h.response(value.output.payload).code(value.output.statusCode)
        : h.response(value).header("Last-modified", lastModified.toUTCString());
};

export const toResource = (data, transformer): object => {
    return transformerService.toResource(data, transformer);
};

export const toCollection = (data, transformer): object => {
    return transformerService.toCollection(data, transformer);
};

export const toPagination = (data, transformer): object => {
    return {
        results: transformerService.toCollection(data.rows, transformer),
        totalCount: data.count,
    };
};
