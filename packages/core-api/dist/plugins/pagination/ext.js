"use strict";
// Based on https://github.com/fknop/hapi-pagination
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hoek_1 = __importDefault(require("@hapi/hoek"));
const dottie_1 = require("dottie");
const querystring_1 = __importDefault(require("querystring"));
class Ext {
    constructor(config) {
        this.config = config;
        this.routePathPrefix = "/api";
        this.routes = [
            { method: "get", path: "/blocks" },
            { method: "get", path: "/blocks/{id}/transactions" },
            { method: "post", path: "/blocks/search" },
            { method: "get", path: "/bridgechains" },
            { method: "post", path: "/bridgechains/search" },
            { method: "get", path: "/businesses" },
            { method: "get", path: "/businesses/{id}/bridgechains" },
            { method: "post", path: "/businesses/search" },
            { method: "get", path: "/delegates" },
            { method: "get", path: "/delegates/{id}/blocks" },
            { method: "get", path: "/delegates/{id}/voters" },
            { method: "post", path: "/delegates/search" },
            { method: "get", path: "/locks" },
            { method: "post", path: "/locks/search" },
            { method: "post", path: "/locks/unlocked" },
            { method: "get", path: "/peers" },
            { method: "get", path: "/transactions" },
            { method: "post", path: "/transactions/search" },
            { method: "get", path: "/transactions/unconfirmed" },
            { method: "get", path: "/votes" },
            { method: "get", path: "/wallets" },
            { method: "get", path: "/wallets/top" },
            { method: "get", path: "/wallets/{id}/locks" },
            { method: "get", path: "/wallets/{id}/transactions" },
            { method: "get", path: "/wallets/{id}/transactions/received" },
            { method: "get", path: "/wallets/{id}/transactions/sent" },
            { method: "get", path: "/wallets/{id}/votes" },
            { method: "post", path: "/wallets/search" },
        ];
    }
    isValidRoute(request) {
        if (!this.hasPagination(request)) {
            return false;
        }
        const { method, path } = request.route;
        return (this.routes.find(route => route.method === method && path === `${this.routePathPrefix}${route.path}`) !==
            undefined);
    }
    onPreHandler(request, h) {
        if (this.isValidRoute(request)) {
            const setParam = (name, defaultValue) => {
                let value;
                if (request.query[name]) {
                    value = parseInt(request.query[name]);
                    if (Number.isNaN(value)) {
                        value = defaultValue;
                    }
                }
                request.query[name] = value || defaultValue;
                return undefined;
            };
            setParam("page", 1);
            setParam("limit", dottie_1.get(this.config, "query.limit.default", 100));
        }
        return h.continue;
    }
    onPostHandler(request, h) {
        const { statusCode } = request.response;
        const processResponse = this.isValidRoute(request) && statusCode >= 200 && statusCode <= 299 && this.hasPagination(request);
        if (!processResponse) {
            return h.continue;
        }
        const { source } = request.response;
        const results = Array.isArray(source) ? source : source.results;
        hoek_1.default.assert(Array.isArray(results), "The results must be an array");
        // strip prefix in baseUri, we want a "clean" relative path
        const baseUri = request.url.pathname.slice(this.routePathPrefix.length) + "?";
        const { query } = request;
        const currentPage = query.page;
        const currentLimit = query.limit;
        const { totalCount } = !!source.totalCount ? source : request;
        let pageCount;
        if (totalCount) {
            pageCount = Math.trunc(totalCount / currentLimit) + (totalCount % currentLimit === 0 ? 0 : 1);
        }
        const getUri = (page) => 
        // tslint:disable-next-line: no-null-keyword
        page ? baseUri + querystring_1.default.stringify(hoek_1.default.applyToDefaults({ ...query, ...request.orig.query }, { page })) : null;
        const newSource = {
            meta: {
                ...(source.meta || {}),
                ...{
                    count: results.length,
                    pageCount: pageCount || 1,
                    totalCount: totalCount ? totalCount : 0,
                    // tslint:disable-next-line: no-null-keyword
                    next: totalCount && currentPage < pageCount ? getUri(currentPage + 1) : null,
                    previous: 
                    // tslint:disable-next-line: no-null-keyword
                    totalCount && currentPage > 1 && currentPage <= pageCount + 1 ? getUri(currentPage - 1) : null,
                    self: getUri(currentPage),
                    first: getUri(1),
                    last: getUri(pageCount),
                },
            },
            data: results,
        };
        if (source.response) {
            const keys = Object.keys(source.response);
            for (const key of keys) {
                if (key !== "meta" && key !== "data") {
                    newSource[key] = source.response[key];
                }
            }
        }
        request.response.source = newSource;
        return h.continue;
    }
    hasPagination(request) {
        const routeOptions = this.getRouteOptions(request);
        return Object.prototype.hasOwnProperty.call(routeOptions, "pagination") ? routeOptions.pagination : true;
    }
    getRouteOptions(request) {
        return request.route.settings.plugins.pagination || {};
    }
}
exports.Ext = Ext;
//# sourceMappingURL=ext.js.map