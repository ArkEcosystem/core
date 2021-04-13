import { Container, Contracts, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { LockCriteria, LockResource } from "../resources-new";

@Container.injectable()
export class LockSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.StandardCriteriaService)
    private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

    @Container.inject(Container.Identifiers.PaginationService)
    private readonly paginationService!: Services.Search.PaginationService;

    public getLock(lockId: string): LockResource | undefined {
        if (this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Locks, lockId)) {
            const wallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
            return this.getLockResourceFromWallet(wallet, lockId);
        } else {
            return undefined;
        }
    }

    public getLocksPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        ...criterias: LockCriteria[]
    ): Contracts.Search.ResultsPage<LockResource> {
        sorting = [...sorting, { property: "timestamp.unix", direction: "desc" }];

        return this.paginationService.getPage(pagination, sorting, this.getLocks(...criterias));
    }

    public getWalletLocksPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        walletAddress: string,
        ...criterias: LockCriteria[]
    ): Contracts.Search.ResultsPage<LockResource> {
        sorting = [...sorting, { property: "timestamp.unix", direction: "desc" }];

        return this.paginationService.getPage(pagination, sorting, this.getWalletLocks(walletAddress, ...criterias));
    }

    private getLockResourceFromWallet(wallet: Contracts.State.Wallet, lockId: string): LockResource {
        const locksAttribute = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks");
        const lockAttribute = locksAttribute[lockId];

        AppUtils.assert.defined<Interfaces.IHtlcLock>(lockAttribute);
        AppUtils.assert.defined<string>(lockAttribute.recipientId);
        AppUtils.assert.defined<string>(wallet.getPublicKey());

        const senderPublicKey = wallet.getPublicKey()!;
        const lastBlock = this.stateStore.getLastBlock();
        const isExpired = AppUtils.expirationCalculator.calculateLockExpirationStatus(
            lastBlock,
            lockAttribute.expiration,
        );

        return {
            lockId,
            senderPublicKey,
            isExpired,
            amount: lockAttribute.amount,
            secretHash: lockAttribute.secretHash,
            recipientId: lockAttribute.recipientId,
            timestamp: AppUtils.formatTimestamp(lockAttribute.timestamp),
            expirationType: lockAttribute.expiration.type,
            expirationValue: lockAttribute.expiration.value,
            vendorField: lockAttribute.vendorField!,
        };
    }

    private *getLocks(...criterias: LockCriteria[]): Iterable<LockResource> {
        for (const [lockId, wallet] of this.walletRepository.getIndex(Contracts.State.WalletIndexes.Locks).entries()) {
            const lockResource = this.getLockResourceFromWallet(wallet, lockId);
            if (this.standardCriteriaService.testStandardCriterias(lockResource, ...criterias)) {
                yield lockResource;
            }
        }
    }

    private *getWalletLocks(walletAddress: string, ...criterias: LockCriteria[]): Iterable<LockResource> {
        const wallet = this.walletRepository.findByAddress(walletAddress);
        const locksAttribute = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});

        for (const lockId of Object.keys(locksAttribute)) {
            const lockResource = this.getLockResourceFromWallet(wallet, lockId);

            if (this.standardCriteriaService.testStandardCriterias(lockResource, ...criterias)) {
                yield lockResource;
            }
        }
    }
}
