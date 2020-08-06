import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { WalletSearchService } from "./wallet-search-service";

export type LockCriteria = Contracts.Search.StandardCriteriaOf<LockResource>;

export type LockResource = {
    lockId: string;
    senderPublicKey: string;
    isExpired: boolean;

    amount: Utils.BigNumber;
    secretHash: string;
    recipientId: string;
    timestamp: number;
    expirationType: Enums.HtlcLockExpirationType;
    expirationValue: number;
    vendorField: string;
};

@Container.injectable()
export class LockSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.WalletSearchService)
    private readonly walletSearchService!: WalletSearchService;

    public getLock(lockId: string, ...criterias: LockCriteria[]): LockResource | undefined {
        if (!this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Locks, lockId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
        const lockResource = this.getLockResource(wallet, lockId);

        if (AppUtils.Search.testStandardCriterias(lockResource, ...criterias)) {
            return lockResource;
        } else {
            return undefined;
        }
    }

    public getLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: LockCriteria[]
    ): Contracts.Search.Page<LockResource> {
        return AppUtils.Search.getPage(pagination, ordering, this.getLocks(...criterias));
    }

    public getWalletLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletId: string,
        ...criterias: LockCriteria[]
    ): Contracts.Search.Page<LockResource> {
        return AppUtils.Search.getPage(pagination, ordering, this.getWalletLocks(walletId, ...criterias));
    }

    private *getLocks(...criterias: LockCriteria[]): Iterable<LockResource> {
        for (const [lockId, wallet] of this.walletRepository.getIndex(Contracts.State.WalletIndexes.Locks).entries()) {
            const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});
            if (!walletLocks[lockId]) {
                continue; // todo: fix index, so walletLocks[lockId] is guaranteed to exist
            }

            const lockResource = this.getLockResource(wallet, lockId);
            if (AppUtils.Search.testStandardCriterias(lockResource, ...criterias)) {
                yield lockResource;
            }
        }
    }

    private *getWalletLocks(walletId: string, ...criterias: LockCriteria[]): Iterable<LockResource> {
        const walletResource = this.walletSearchService.getWallet(walletId);
        if (!walletResource) {
            throw new Error("Wallet not found");
        }

        const wallet = this.walletRepository.findByAddress(walletResource.address);
        const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {});

        for (const lockId of Object.keys(walletLocks)) {
            const lockResource = this.getLockResource(wallet, lockId);

            if (AppUtils.Search.testStandardCriterias(lockResource, ...criterias)) {
                yield lockResource;
            }
        }
    }

    private getLockResource(wallet: Contracts.State.Wallet, lockId: string): LockResource {
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
            timestamp: walletLock.timestamp,
            expirationType: walletLock.expiration.type,
            expirationValue: walletLock.expiration.value,
            vendorField: walletLock.vendorField!,
        };
    }
}
