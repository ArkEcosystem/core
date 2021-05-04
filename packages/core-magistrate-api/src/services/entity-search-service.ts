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

    public getEntity(entityId: string): EntityResource | undefined {
        if (this.walletRepository.hasByIndex("entities", entityId)) {
            const wallet = this.walletRepository.findByIndex("entities", entityId);
            return this.getEntityResourceFromWallet(wallet, entityId);
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

    private getEntityResourceFromWallet(wallet: Contracts.State.Wallet, entityId: string): EntityResource {
        const entitiesAttribute = wallet.getAttribute<IEntitiesWallet>("entities");
        const entityAttribute = entitiesAttribute[entityId];

        AppUtils.assert.defined<IEntityWallet>(entityAttribute);
        AppUtils.assert.defined<string>(wallet.getPublicKey());

        return {
            id: entityId,
            address: wallet.getAddress(),
            publicKey: wallet.getPublicKey()!,
            isResigned: !!entityAttribute.resigned,
            type: entityAttribute.type,
            subType: entityAttribute.subType,
            data: entityAttribute.data,
        };
    }

    private *getEntities(...criterias: EntityCriteria[]): Iterable<EntityResource> {
        for (const [entityId, wallet] of this.walletRepository.getIndex("entities").entries()) {
            const entityResource = this.getEntityResourceFromWallet(wallet, entityId);

            if (this.standardCriteriaService.testStandardCriterias(entityResource, ...criterias)) {
                yield entityResource;
            }
        }
    }
}
