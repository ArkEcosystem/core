import { Container, Contracts, Services } from "@arkecosystem/core-kernel";

import { WalletCriteria, WalletResource } from "../resources-new";

@Container.injectable()
export class WalletSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StandardCriteriaService)
    private readonly standardCriteriaService!: Services.Search.StandardCriteriaService;

    @Container.inject(Container.Identifiers.PaginationService)
    private readonly paginationService!: Services.Search.PaginationService;

    public getWallet(walletId: string): WalletResource | undefined {
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

        if (wallet) {
            return this.getWalletResourceFromWallet(wallet);
        } else {
            return undefined;
        }
    }

    public getWalletsPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.ResultsPage<WalletResource> {
        sorting = [...sorting, { property: "balance", direction: "desc" }];

        return this.paginationService.getPage(pagination, sorting, this.getWallets(...criterias));
    }

    public getActiveWalletsPage(
        pagination: Contracts.Search.Pagination,
        sorting: Contracts.Search.Sorting,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.ResultsPage<WalletResource> {
        sorting = [...sorting, { property: "balance", direction: "desc" }];

        return this.paginationService.getPage(pagination, sorting, this.getActiveWallets(...criterias));
    }

    private getWalletResourceFromWallet(wallet: Contracts.State.Wallet): WalletResource {
        return {
            address: wallet.getAddress(),
            publicKey: wallet.getPublicKey(),
            balance: wallet.getBalance(),
            nonce: wallet.getNonce(),
            attributes: wallet.getAttributes(),
        };
    }

    private *getWallets(...criterias: WalletCriteria[]): Iterable<WalletResource> {
        for (const wallet of this.walletRepository.allByAddress()) {
            const walletResource = this.getWalletResourceFromWallet(wallet);

            if (this.standardCriteriaService.testStandardCriterias(walletResource, ...criterias)) {
                yield walletResource;
            }
        }
    }

    private *getActiveWallets(...criterias: WalletCriteria[]): Iterable<WalletResource> {
        for (const wallet of this.walletRepository.allByPublicKey()) {
            const walletResource = this.getWalletResourceFromWallet(wallet);

            if (this.standardCriteriaService.testStandardCriterias(walletResource, ...criterias)) {
                yield walletResource;
            }
        }
    }
}
