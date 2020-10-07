import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { EntityCriteria, entityCriteriaSchemaObject, EntityResource } from "../resources";
import { EntitySearchService } from "../services";

@Container.injectable()
export class EntityController extends Controller {
    @Container.inject(Identifiers.EntitySearchService)
    private readonly entitySearchService!: EntitySearchService;

    public index(request: Hapi.Request): Contracts.Search.ResultsPage<EntityResource> {
        const pagination = this.getQueryPagination(request.query);
        const sorting = request.query.orderBy as Contracts.Search.Sorting;
        const criteria = this.getQueryCriteria(request.query, entityCriteriaSchemaObject) as EntityCriteria;

        return this.entitySearchService.getEntitiesPage(pagination, sorting, criteria);
    }

    public show(request: Hapi.Request): { data: EntityResource } | Boom {
        const entityId = request.params.id as string;
        const entityResource = this.entitySearchService.getEntity(entityId);

        if (!entityResource) {
            return notFound("Entity not found");
        }

        return { data: entityResource };
    }
}
