import { Controller } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import { EntityCriteria, EntityResource, EntityResourceProvider, EntityResourcesPage } from "../services";

@Container.injectable()
export class EntityController extends Controller {
    @Container.inject(Identifiers.EntityResourceProvider)
    private readonly entityResourceProvider!: EntityResourceProvider;

    public index(request: Hapi.Request): EntityResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as EntityCriteria;

        return this.entityResourceProvider.getEntitiesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): EntityResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as EntityCriteria;

        return this.entityResourceProvider.getEntitiesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): EntityResource | Boom {
        const entityId = request.params.id as string;
        const entity = this.entityResourceProvider.getEntity(entityId);

        if (!entity) {
            return notFound("Entity not found");
        }

        return entity;
    }
}
