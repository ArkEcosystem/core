import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Resource } from "../interfaces";

@Container.injectable()
export class Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    protected paginate(request: Hapi.Request): Repositories.Search.SearchPagination {
        const pagination = {
            offset: (request.query.page - 1) * request.query.limit || 0,
            limit: request.query.limit || 100,
        };

        if (request.query.offset) {
            pagination.offset = request.query.offset;
        }

        return pagination;
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

    protected toResource(data, transformer, transform = true): object {
        return transform
            ? this.app.resolve<Resource>(transformer).transform(data)
            : this.app.resolve<Resource>(transformer).raw(data);
    }

    protected toCollection(data, transformer, transform = true): object {
        return data.map(item => this.toResource(item, transformer, transform));
    }

    protected toPagination(data, transformer, transform = true): object {
        return {
            results: this.toCollection(data.rows, transformer, transform),
            totalCount: data.count,
            meta: { totalCountIsEstimate: data.countIsEstimate },
        };
    }
}
