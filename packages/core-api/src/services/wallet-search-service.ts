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

    public getWallet(walletId: string, ...criterias: WalletCriteria[]): WalletResource | undefined {
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

        const walletResource = this.getWalletResourceFromWallet(wallet);

        if (this.standardCriteriaService.testStandardCriterias(walletResource, ...criterias)) {
            return walletResource;
        } else {
            return undefined;
        }
    }

    public getWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.ResultsPage<WalletResource> {
        ordering = [...ordering, { property: "balance", direction: "desc" }];

        return this.paginationService.getPage(pagination, ordering, this.getWallets(...criterias));
    }

    public getActiveWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.ResultsPage<WalletResource> {
        ordering = [...ordering, { property: "balance", direction: "desc" }];

        return this.paginationService.getPage(pagination, ordering, this.getActiveWallets(...criterias));
    }

    public getWalletResourceFromWallet(wallet: Contracts.State.Wallet): WalletResource {
        return {
            address: wallet.address,
            publicKey: wallet.publicKey,
            balance: wallet.balance,
            nonce: wallet.nonce,
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
