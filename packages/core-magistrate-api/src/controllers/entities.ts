import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import * as MagistrateTransactions from "@arkecosystem/core-magistrate-transactions";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

@Container.injectable()
export class EntityController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(MagistrateTransactions.Identifiers.EntitySearchService)
    private readonly entitySearchService!: MagistrateTransactions.EntitySearchService;

    public index(request: Hapi.Request): Contracts.Search.Page<MagistrateTransactions.Entity> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as MagistrateTransactions.EntityCriteria;

        return this.entitySearchService.getEntitiesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): Contracts.Search.Page<MagistrateTransactions.Entity> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as MagistrateTransactions.EntityCriteria;

        return this.entitySearchService.getEntitiesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): { data: MagistrateTransactions.Entity } | Boom {
        const entityId = request.params.id as string;
        const entity = this.entitySearchService.getEntity(entityId);

        if (!entity) {
            return notFound("Entity not found");
        }

        return { data: entity };
    }
}
