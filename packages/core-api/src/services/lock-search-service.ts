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

    public getLock(lockId: string, ...criterias: LockCriteria[]): LockResource | undefined {
        if (!this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Locks, lockId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
        const lockResource = this.getLockResourceFromWallet(wallet, lockId);

        if (this.standardCriteriaService.testStandardCriterias(lockResource, ...criterias)) {
            return lockResource;
        } else {
            return undefined;
        }
    }

    public getLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: LockCriteria[]
    ): Contracts.Search.ResultsPage<LockResource> {
        ordering = [...ordering, { property: "timestamp.unix", direction: "desc" }];

        return this.paginationService.getPage(pagination, ordering, this.getLocks(...criterias));
    }

    public getWalletLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletAddress: string,
        ...criterias: LockCriteria[]
    ): Contracts.Search.ResultsPage<LockResource> {
        ordering = [...ordering, { property: "timestamp.unix", direction: "desc" }];

        return this.paginationService.getPage(pagination, ordering, this.getWalletLocks(walletAddress, ...criterias));
    }

    public getLockResourceFromWallet(wallet: Contracts.State.Wallet, lockId: string): LockResource {
        const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks");
        const walletLock = walletLocks[lockId];

        AppUtils.assert.defined<Interfaces.IHtlcLock>(walletLock);
        AppUtils.assert.defined<string>(walletLock.recipientId);
        AppUtils.assert.defined<string>(wallet.publicKey);

        const senderPublicKey = wallet.publicKey;
        const lastBlock = this.stateStore.getLastBlock();
        const isExpired = AppUtils.expirationCalculator.calculateLockExpirationStatus(lastBlock, walletLock.expiration);

        return {
            lockId,
            senderPublicKey,
            isExpired,
            amount: walletLock.amount,
            secretHash: walletLock.secretHash,
            recipientId: walletLock.recipientId,
            timestamp: AppUtils.formatTimestamp(walletLock.timestamp),
            expirationType: walletLock.expiration.type,
            expirationValue: walletLock.expiration.value,
            vendorField: walletLock.vendorField!,
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
        const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});

        for (const lockId of Object.keys(walletLocks)) {
            const lockResource = this.getLockResourceFromWallet(wallet, lockId);

            if (this.standardCriteriaService.testStandardCriterias(lockResource, ...criterias)) {
                yield lockResource;
            }
        }
    }
}
