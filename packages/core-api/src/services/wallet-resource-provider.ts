import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

import { WalletCriteria, WalletResourcesPage } from "./wallet-resource";

@Container.injectable()
export class WalletResourceProvider {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public getWallet(walletId: string, ...criterias: WalletCriteria[]): Contracts.State.Wallet | undefined {
        let wallet: Contracts.State.Wallet | undefined;

        if (!wallet && this.walletRepository.hasByAddress(walletId)) {
            wallet = this.walletRepository.findByAddress(walletId);
        }

        if (!wallet && this.walletRepository.hasByPublicKey(walletId)) {
            wallet = this.walletRepository.findByPublicKey(walletId);
        }

        if (!wallet && this.walletRepository.hasByUsername(walletId)) {
            wallet = this.walletRepository.findByUsername(walletId);
        }

        if (!wallet) {
            return undefined;
        }

        if (!AppUtils.Search.testCriterias(wallet, ...criterias)) {
            return undefined;
        }

        return wallet;
    }

    public *getWallets(...criterias: WalletCriteria[]): Iterable<Contracts.State.Wallet> {
        for (const wallet of this.walletRepository.allByAddress()) {
            if (AppUtils.Search.testCriterias(wallet, ...criterias)) {
                yield wallet;
            }
        }
    }

    public *getActiveWallets(...criterias: WalletCriteria[]): Iterable<Contracts.State.Wallet> {
        for (const wallet of this.walletRepository.allByPublicKey()) {
            if (AppUtils.Search.testCriterias(wallet, ...criterias)) {
                yield wallet;
            }
        }
    }

    public getWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): WalletResourcesPage {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getWallets(...criterias));
    }

    public getActiveWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): WalletResourcesPage {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getActiveWallets(...criterias));
    }
}
