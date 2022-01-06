import { Container, Contracts, Providers } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Resource } from "../interfaces";
import { SchemaObject } from "../schemas";

@Container.injectable()
export class Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-api")
    protected readonly apiConfiguration!: Providers.PluginConfiguration;

    protected getQueryPagination(query: Hapi.RequestQuery): Contracts.Search.Pagination {
        const pagination = {
            offset: (query.page - 1) * query.limit || 0,
            limit: query.limit,
        };

        if (query.offset) {
            pagination.offset = query.offset;
        }

        return pagination;
    }

    protected getQueryCriteria(query: Hapi.RequestQuery, schemaObject: SchemaObject): unknown {
        const schemaObjectKeys = Object.keys(schemaObject);
        const criteria = {};
        for (const [key, value] of Object.entries(query)) {
            if (schemaObjectKeys.includes(key)) {
                criteria[key] = value;
            }
        }
        return criteria;
    }

    protected getListingPage(request: Hapi.Request): Contracts.Search.Pagination {
        const pagination = {
            offset: (request.query.page - 1) * request.query.limit || 0,
            limit: request.query.limit || 100,
        };

        if (request.query.offset) {
            pagination.offset = request.query.offset;
        }

        return pagination;
    }

    protected getListingOrder(request: Hapi.Request): Contracts.Search.Sorting {
        if (!request.query.orderBy) {
            return [];
        }

        const orderBy = Array.isArray(request.query.orderBy) ? request.query.orderBy : request.query.orderBy.split(",");

        return orderBy.map((s: string) => ({
            property: s.split(":")[0],
            direction: s.split(":")[1] === "desc" ? "desc" : "asc",
        }));
    }

    protected getListingOptions(): Contracts.Search.Options {
        const estimateTotalCount = this.apiConfiguration.getOptional<boolean>("options.estimateTotalCount", true);

        return {
            estimateTotalCount,
        };
    }

    protected respondWithResource(data, transformer, transform = true): any {
        if (!data) {
            return Boom.notFound();
        }

        return { data: this.toResource(data, transformer, transform) };
    }

    protected respondWithCollection(data, transformer, transform = true): object {
        return {
            data: this.toCollection(data, transformer, transform),
        };
    }

    protected toResource<T, R extends Resource>(
        item: T,
        transformer: new () => R,
        transform = true,
    ): ReturnType<R["raw"]> | ReturnType<R["transform"]> {
        const resource = this.app.resolve<R>(transformer);

        if (transform) {
            return resource.transform(item) as ReturnType<R["transform"]>;
        } else {
            return resource.raw(item) as ReturnType<R["raw"]>;
        }
    }

    protected toCollection<T, R extends Resource>(
        items: T[],
        transformer: new () => R,
        transform = true,
    ): ReturnType<R["raw"]>[] | ReturnType<R["transform"]>[] {
        return items.map((item) => this.toResource(item, transformer, transform));
    }

    protected toPagination<T, R extends Resource>(
        resultsPage: Contracts.Search.ResultsPage<T>,
        transformer: new () => R,
        transform = true,
    ): Contracts.Search.ResultsPage<ReturnType<R["raw"]>> | Contracts.Search.ResultsPage<ReturnType<R["transform"]>> {
        const items = this.toCollection(resultsPage.results, transformer, transform);

        return { ...resultsPage, results: items };
    }
}
