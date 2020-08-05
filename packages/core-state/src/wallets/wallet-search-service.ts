import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";

@Container.injectable()
export class WalletSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public getWallet(
        walletId: string,
        ...criterias: Contracts.State.WalletCriteria[]
    ): Contracts.State.Wallet | undefined {
        let wallet: Contracts.State.Wallet | undefined;

        if (this.walletRepository.hasByAddress(walletId)) {
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

        if (!AppUtils.Search.testStandardCriterias(wallet, ...criterias)) {
            return undefined;
        }

        return wallet;
    }

    public getWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: Contracts.State.WalletCriteria[]
    ): Contracts.Search.Page<Contracts.State.Wallet> {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getWallets(...criterias));
    }

    public getActiveWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: Contracts.State.WalletCriteria[]
    ): Contracts.Search.Page<Contracts.State.Wallet> {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getActiveWallets(...criterias));
    }

    private *getWallets(...criterias: Contracts.State.WalletCriteria[]): Iterable<Contracts.State.Wallet> {
        for (const wallet of this.walletRepository.allByAddress()) {
            if (AppUtils.Search.testStandardCriterias(wallet, ...criterias)) {
                yield wallet;
            }
        }
    }

    private *getActiveWallets(...criterias: Contracts.State.WalletCriteria[]): Iterable<Contracts.State.Wallet> {
        for (const wallet of this.walletRepository.allByPublicKey()) {
            if (AppUtils.Search.testStandardCriterias(wallet, ...criterias)) {
                yield wallet;
            }
        }
    }
}
