import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { EntityCriteria, EntityResource, EntityResourcesPage } from "./entity-resource";

@Container.injectable()
export class EntityResourceProvider {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public getEntity(entityId: string, ...criterias: EntityCriteria[]): EntityResource | undefined {
        if (!this.walletRepository.hasByIndex("entities", entityId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex("entities", entityId);
        const entity = this.getEntityResource(wallet, entityId);

        if (!AppUtils.Search.testCriterias(entity, ...criterias)) {
            return undefined;
        }

        return entity;
    }

    public *getEntities(...criterias: EntityCriteria[]): Iterable<EntityResource> {
        for (const [entityId, wallet] of this.walletRepository.getIndex("entities").entries()) {
            const entity = this.getEntityResource(wallet, entityId);

            if (AppUtils.Search.testCriterias(entity, ...criterias)) {
                yield entity;
            }
        }
    }

    public getEntitiesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: EntityCriteria[]
    ): EntityResourcesPage {
        return AppUtils.Search.getPage(pagination, ordering, this.getEntities(...criterias));
    }

    private getEntityResource(wallet: Contracts.State.Wallet, entityId: string): EntityResource {
        const walletEntities = wallet.getAttribute<any>("entities", {});
        const walletEntity = walletEntities[entityId];

        AppUtils.assert.defined<string>(wallet.publicKey);
        AppUtils.assert.defined<any>(walletEntity); // TODO: import { Interfaces } from "core-magistrate-transactions"

        return {
            id: entityId,
            publicKey: wallet.publicKey,
            address: wallet.address,
            isResigned: !!walletEntity.resigned,

            type: walletEntity.type,
            subType: walletEntity.subType,
            data: walletEntity.data,
        };
    }
}
