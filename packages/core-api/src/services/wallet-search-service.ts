import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import Joi from "@hapi/joi";

import { BigNumber, NonNegativeBigNumber } from "../schemas";

export type WalletCriteria = Contracts.Search.StandardCriteriaOf<WalletResource>;

export type WalletResource = {
    address: string;
    publicKey?: string;
    balance: Utils.BigNumber;
    nonce: Utils.BigNumber;
    attributes: object;
};

export const WalletResourceSchemaObject = {
    address: Joi.string().alphanum().length(34),
    publicKey: Joi.string().hex().length(66),
    balance: BigNumber,
    nonce: NonNegativeBigNumber,
    attributes: Joi.object(),
};

@Container.injectable()
export class WalletSearchService {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

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

        if (AppUtils.Search.testStandardCriterias(walletResource, ...criterias)) {
            return walletResource;
        } else {
            return undefined;
        }
    }

    public getWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.Page<WalletResource> {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getWallets(...criterias));
    }

    public getActiveWalletsPage(
        pagination: Contracts.Search.Pagination,
        ordering: Contracts.Search.Ordering,
        ...criterias: WalletCriteria[]
    ): Contracts.Search.Page<WalletResource> {
        return AppUtils.Search.getPage(pagination, [ordering, "balance:desc"], this.getActiveWallets(...criterias));
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

            if (AppUtils.Search.testStandardCriterias(walletResource, ...criterias)) {
                yield walletResource;
            }
        }
    }

    private *getActiveWallets(...criterias: WalletCriteria[]): Iterable<WalletResource> {
        for (const wallet of this.walletRepository.allByPublicKey()) {
            const walletResource = this.getWalletResourceFromWallet(wallet);

            if (AppUtils.Search.testStandardCriterias(walletResource, ...criterias)) {
                yield walletResource;
            }
        }
    }
}
