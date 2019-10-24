// Based on https://github.com/fknop/hapi-pagination

import { Utils } from "@arkecosystem/core-kernel";
import Hoek from "@hapi/hoek";
import Qs from "querystring";

interface IRoute {
    method: string;
    path: string;
}

export class Ext {
    private readonly routes: IRoute[] = [
        { method: "get", path: "/api/blocks" },
        { method: "get", path: "/api/blocks/{id}/transactions" },
        { method: "post", path: "/api/blocks/search" },
        { method: "get", path: "/api/bridgechains" },
        { method: "post", path: "/api/bridgechains/search" },
        { method: "get", path: "/api/businesses" },
        { method: "get", path: "/api/businesses/{id}/bridgechains" },
        { method: "post", path: "/api/businesses/search" },
        { method: "get", path: "/api/delegates" },
        { method: "get", path: "/api/delegates/{id}/blocks" },
        { method: "get", path: "/api/delegates/{id}/voters" },
        { method: "post", path: "/api/delegates/search" },
        { method: "get", path: "/api/locks" },
        { method: "post", path: "/api/locks/search" },
        { method: "post", path: "/api/locks/unlocked" },
        { method: "get", path: "/api/peers" },
        { method: "get", path: "/api/transactions" },
        { method: "post", path: "/api/transactions/search" },
        { method: "get", path: "/api/transactions/unconfirmed" },
        { method: "get", path: "/api/votes" },
        { method: "get", path: "/api/wallets" },
        { method: "get", path: "/api/wallets/top" },
        { method: "get", path: "/api/wallets/{id}/locks" },
        { method: "get", path: "/api/wallets/{id}/transactions" },
        { method: "get", path: "/api/wallets/{id}/transactions/received" },
        { method: "get", path: "/api/wallets/{id}/transactions/sent" },
        { method: "get", path: "/api/wallets/{id}/votes" },
        { method: "post", path: "/api/wallets/search" },
    ];

    constructor(private readonly config) {}

    public isValidRoute(request) {
        if (!this.hasPagination(request)) {
            return false;
        }

        const { method, path } = request.route;

        return this.routes.find(route => route.method === method && route.path === path) !== undefined;
    }

    public onPreHandler(request, h) {
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
            setParam("limit", Utils.get(this.config, "query.limit.default", 100));
        }

        return h.continue;
    }

    public onPostHandler(request, h) {
        const { statusCode } = request.response;
        const processResponse: boolean =
            this.isValidRoute(request) && statusCode >= 200 && statusCode <= 299 && this.hasPagination(request);

        if (!processResponse) {
            return h.continue;
        }

        const { source } = request.response;
        const results = Array.isArray(source) ? source : source.results;

        Hoek.assert(Array.isArray(results), "The results must be an array");

        const baseUri = request.url.pathname + "?";
        const { query } = request;
        const currentPage = query.page;
        const currentLimit = query.limit;

        const { totalCount } = source.totalCount ? source : request;

        let pageCount: number = 1;
        if (totalCount) {
            pageCount = Math.trunc(totalCount / currentLimit) + (totalCount % currentLimit === 0 ? 0 : 1);
        }

        const getUri = (page: number | null): string | null =>
            // tslint:disable-next-line: no-null-keyword
            page ? baseUri + Qs.stringify(Hoek.applyToDefaults({ ...query, ...request.orig.query }, { page })) : null;

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

    public hasPagination(request) {
        const routeOptions = this.getRouteOptions(request);

        return Object.prototype.hasOwnProperty.call(routeOptions, "pagination") ? routeOptions.pagination : true;
    }

    private getRouteOptions(request) {
        return request.route.settings.plugins.pagination || {};
    }
}
