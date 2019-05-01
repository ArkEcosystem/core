import Hapi from "@hapi/hapi";
import { transformerService } from "../../services/transformer";

export const paginate = (request: Hapi.Request): any => {
    return {
        // @ts-ignore
        offset: request.query.offset || 0,
        // @ts-ignore
        limit: request.query.limit || 100,
    };
};

export const respondWith = (data, error = false): object => {
    return error ? { error: data, success: false } : { ...data, success: true };
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
