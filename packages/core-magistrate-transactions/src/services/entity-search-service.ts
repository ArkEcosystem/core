import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { Entity, EntityCriteria, IEntitiesWallet, IEntityWallet } from "../interfaces";

@Container.injectable()
export class EntitySearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.WalletSearchService)
    private readonly walletSearchService!: Contracts.State.WalletSearchService;

    public getEntity(entityId: string, ...criterias: EntityCriteria[]): Entity | undefined {
        if (!this.walletRepository.hasByIndex("entities", entityId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex("entities", entityId);
        const entity = this.getEntityResource(wallet, entityId);

        if (!AppUtils.Search.testStandardCriterias(entity, ...criterias)) {
            return undefined;
        }

        return entity;
    }

    public getEntitiesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: EntityCriteria[]
    ): Contracts.Search.Page<Entity> {
        ordering = [ordering, "name:asc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getEntities(...criterias));
    }

    public getWalletEntitiesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletId: string,
        ...criterias: EntityCriteria[]
    ): Contracts.Search.Page<Entity> {
        ordering = [ordering, "name:asc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getWalletEntities(walletId, ...criterias));
    }

    private *getEntities(...criterias: EntityCriteria[]): Iterable<Entity> {
        for (const [entityId, wallet] of this.walletRepository.getIndex("entities").entries()) {
            if (!wallet.hasAttribute(`entities.${entityId}`)) {
                // todo: fix index, so `entities.${entityId}` is guaranteed to exist
                continue;
            }

            const entity = this.getEntityResource(wallet, entityId);

            if (AppUtils.Search.testStandardCriterias(entity, ...criterias)) {
                yield entity;
            }
        }
    }

    private *getWalletEntities(walletId: string, ...criterias: EntityCriteria[]): Iterable<Entity> {
        const wallet = this.walletSearchService.getWallet(walletId);
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        for (const entityId of Object.keys(wallet.getAttribute<IEntitiesWallet>("entities", {}))) {
            const entity = this.getEntityResource(wallet, entityId);

            if (AppUtils.Search.testStandardCriterias(entity, ...criterias)) {
                yield entity;
            }
        }
    }

    private getEntityResource(wallet: Contracts.State.Wallet, entityId: string): Entity {
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
