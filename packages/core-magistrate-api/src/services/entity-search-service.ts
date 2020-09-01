import { Container, Contracts, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { IEntitiesWallet, IEntityWallet } from "@arkecosystem/core-magistrate-transactions";

import { EntityCriteria, EntityResource } from "../resources";

@Container.injectable()
export class EntitySearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StandardCriteriaService)
    private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

    @Container.inject(Container.Identifiers.PaginationService)
    private readonly paginationService!: Services.Search.PaginationService;

    public getEntity(entityId: string, ...criterias: EntityCriteria[]): EntityResource | undefined {
        if (!this.walletRepository.hasByIndex("entities", entityId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex("entities", entityId);
        const entityResource = this.getEntityResourceFromWallet(wallet, entityId);

        if (this.standardCriteriaService.testStandardCriterias(entityResource, ...criterias)) {
            return entityResource;
        } else {
            return undefined;
        }
    }

    public getEntitiesPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        ...criterias: EntityCriteria[]
    ): Contracts.Search.ResultsPage<EntityResource> {
        sorting = [...sorting, { property: "data.name", direction: "asc" }];

        return this.paginationService.getPage(pagination, sorting, this.getEntities(...criterias));
    }

    private *getEntities(...criterias: EntityCriteria[]): Iterable<EntityResource> {
        for (const [entityId, wallet] of this.walletRepository.getIndex("entities").entries()) {
            const entityResource = this.getEntityResourceFromWallet(wallet, entityId);

            if (this.standardCriteriaService.testStandardCriterias(entityResource, ...criterias)) {
                yield entityResource;
            }
        }
    }

    private getEntityResourceFromWallet(wallet: Contracts.State.Wallet, entityId: string): EntityResource {
        const walletEntities = wallet.getAttribute<IEntitiesWallet>("entities");
        const walletEntity = walletEntities[entityId];

        AppUtils.assert.defined<IEntityWallet>(walletEntity);
        AppUtils.assert.defined<string>(wallet.publicKey);

        return {
            id: entityId,
            address: wallet.address,
            publicKey: wallet.publicKey,
            isResigned: !!walletEntity.resigned,
            type: walletEntity.type,
            subType: walletEntity.subType,
            data: walletEntity.data,
        };
    }
}
