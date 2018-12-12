import Boom from "boom";
import { transform } from "./transformer";

/**
 * Transform the given data into a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Object}
 */
const transformResource = (request, data) => transform(data);

/**
 * Transform the given data into a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Array}
 */
const transformCollection = (request, data) => data.map(d => transformResource(request, d));

/**
 * Create a pagination object for the request.
 * @param  {Hapi.Request} request
 * @return {Object}
 */
const paginate = request => ({
    offset: (request.query.page - 1) * request.query.limit,
    limit: request.query.limit,
});

/**
 * Respond with a resource.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Hapi.Response}
 */
const respondWithResource = (request, data) => (data ? { data: transformResource(request, data) } : Boom.notFound());

/**
 * Respond with a collection.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Object}
 */
const respondWithCollection = (request, data) => ({
    data: transformCollection(request, data),
});

/**
 * Alias of "transformResource".
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Hapi.Response}
 */
const toResource = (request, data) => transformResource(request, data);

/**
 * Alias of "transformCollection".
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Hapi.Response}
 */
const toCollection = (request, data) => transformCollection(request, data);

/**
 * Transform the given data into a pagination.
 * @param  {Hapi.Request} request
 * @param  {Object} data
 * @return {Hapi.Response}
 */
const toPagination = (request, data) => ({
    results: transformCollection(request, data.rows),
    totalCount: data.count,
});

export {
    transformResource,
    transformCollection,
    paginate,
    respondWithResource,
    respondWithCollection,
    toResource,
    toCollection,
    toPagination,
};
