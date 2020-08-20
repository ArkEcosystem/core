import { Identifiers as ApiIdentifiers, WalletSearchService } from "@arkecosystem/core-api";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { IEntitiesWallet, IEntityWallet } from "@arkecosystem/core-magistrate-transactions";

import { EntityCriteria, EntityResource } from "../resources";

@Container.injectable()
export class EntitySearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(ApiIdentifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    public getEntity(entityId: string, ...criterias: EntityCriteria[]): EntityResource | undefined {
        if (!this.walletRepository.hasByIndex("entities", entityId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex("entities", entityId);
        const entityResource = this.getEntityResourceFromWallet(wallet, entityId);

        if (AppUtils.Search.testStandardCriterias(entityResource, ...criterias)) {
            return entityResource;
        } else {
            return undefined;
        }
    }

    public getEntitiesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: EntityCriteria[]
    ): Contracts.Search.Page<EntityResource> {
        ordering = [ordering, "data.name:asc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getEntities(...criterias));
    }

    public getWalletEntitiesPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletId: string,
        ...criterias: EntityCriteria[]
    ): Contracts.Search.Page<EntityResource> {
        ordering = [ordering, "data.name:asc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getWalletEntities(walletId, ...criterias));
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

    private *getEntities(...criterias: EntityCriteria[]): Iterable<EntityResource> {
        for (const [entityId, wallet] of this.walletRepository.getIndex("entities").entries()) {
            const walletEntities = wallet.getAttribute<IEntitiesWallet>("entities", {});
            if (!walletEntities[entityId]) {
                continue; // todo: fix index, so walletEntities[entityId] is guaranteed to exist
            }

            const entityResource = this.getEntityResourceFromWallet(wallet, entityId);
            if (AppUtils.Search.testStandardCriterias(entityResource, ...criterias)) {
                yield entityResource;
            }
        }
    }

    private *getWalletEntities(walletId: string, ...criterias: EntityCriteria[]): Iterable<EntityResource> {
        const walletResource = this.walletSearchService.getWallet(walletId);
        if (!walletResource) {
            throw new Error("Wallet not found");
        }

        const wallet = this.walletRepository.findByAddress(walletResource.address);
        const walletEntities = wallet.getAttribute<IEntitiesWallet>("entities", {});

        for (const entityId of Object.keys(walletEntities)) {
            const entityResource = this.getEntityResourceFromWallet(wallet, entityId);

            if (AppUtils.Search.testStandardCriterias(entityResource, ...criterias)) {
                yield entityResource;
            }
        }
    }
}
