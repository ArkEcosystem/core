import { Container, Providers, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { TransformerService } from "../services/transformer";

// todo: review the implementation of all methods

@Container.injectable()
export class Utils {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    public paginate(request: Hapi.Request): any {
        const pagination = {
            offset: (request.query.page - 1) * request.query.limit || 0,
            limit: request.query.limit || 100,
        };

        if (request.query.offset) {
            pagination.offset = request.query.offset;
        }

        return pagination;
    }

    public respondWithResource(data, transformer, transform = true): object {
        if (!data) {
            return Boom.notFound();
        }

        return { data: this.transformerService.toResource(data, transformer, transform) };
    }

    public respondWithCollection(data, transformer, transform = true): object {
        return {
            data: this.transformerService.toCollection(data, transformer, transform),
        };
    }

    public respondWithCache(data, h): any {
        if (
            !this.app
                .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
                .get("state")
                .config()
                .get<boolean>("plugins.cache.enabled")
        ) {
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
    }

    public toResource(data, transformer, transform = true): object {
        return this.transformerService.toResource(data, transformer, transform);
    }

    public toCollection(data, transformer, transform = true): object {
        return this.transformerService.toCollection(data, transformer, transform);
    }

    public toPagination(data, transformer, transform = true): object {
        return {
            results: this.transformerService.toCollection(data.rows, transformer, transform),
            totalCount: data.count,
            meta: { totalCountIsEstimate: data.countIsEstimate },
        };
    }

    private get transformerService(): TransformerService {
        return this.app.resolve<TransformerService>(TransformerService);
    }
}
