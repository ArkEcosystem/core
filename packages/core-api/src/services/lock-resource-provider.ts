import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/crypto";

import { Identifiers } from "../identifiers";
import { LockCriteria, LockResource, LockResourcesPage } from "./lock-resource";
import { WalletResourceProvider } from "./wallet-resource-provider";

@Container.injectable()
export class LockResourceProvider {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Identifiers.WalletResourceProvider)
    private readonly walletService!: WalletResourceProvider;

    public getLock(lockId: string, ...criterias: LockCriteria[]): LockResource | undefined {
        if (!this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Locks, lockId)) {
            return undefined;
        }

        const wallet = this.walletRepository.findByIndex(Contracts.State.WalletIndexes.Locks, lockId);
        const lock = this.getLockResource(wallet, lockId);

        if (!AppUtils.Search.testCriterias(lock, ...criterias)) {
            return undefined;
        }

        return lock;
    }

    public *getLocks(...criterias: LockCriteria[]): Iterable<LockResource> {
        for (const [lockId, wallet] of this.walletRepository.getIndex(Contracts.State.WalletIndexes.Locks).entries()) {
            const lock = this.getLockResource(wallet, lockId);

            if (AppUtils.Search.testCriterias(lock, ...criterias)) {
                yield lock;
            }
        }
    }

    public *getWalletLocks(walletId: string, ...criterias: LockCriteria[]): Iterable<LockResource> {
        const wallet = this.walletService.getWallet(walletId);

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        for (const lockId of Object.keys(wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks", {}))) {
            const lock = this.getLockResource(wallet, lockId);

            if (AppUtils.Search.testCriterias(lock, ...criterias)) {
                yield lock;
            }
        }
    }

    public getLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: LockCriteria[]
    ): LockResourcesPage {
        ordering = [ordering, "timestamp:desc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getLocks(...criterias));
    }

    public getWalletLocksPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        walletId: string,
        ...criterias: LockCriteria[]
    ): LockResourcesPage {
        ordering = [ordering, "timestamp:desc"];

        return AppUtils.Search.getPage(pagination, ordering, this.getWalletLocks(walletId, ...criterias));
    }

    private getLockResource(wallet: Contracts.State.Wallet, lockId: string): LockResource {
        const walletLocks = wallet.getAttribute<Interfaces.IHtlcLocks>("htlc.locks");
        const walletLock = walletLocks[lockId];

        // todo: fix index, so walletLocks[lockId] is guaranteed to exist
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
