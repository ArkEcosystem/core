import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BlockResource, DelegateResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Container.Identifiers.BlockHistoryService)
    private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = this.walletRepository.search(Contracts.State.SearchScope.Delegates, {
            ...request.query,
            ...this.getListingPage(request),
        });

        return this.toPagination(delegates, DelegateResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (delegate instanceof Boom) {
            return delegate;
        }

        return this.respondWithResource(delegate, DelegateResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = this.walletRepository.search(Contracts.State.SearchScope.Delegates, {
            ...request.payload,
            ...request.query,
            ...this.getListingPage(request),
        });

        return this.toPagination(delegates, DelegateResource);
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);
        if (delegate instanceof Boom) {
            return delegate;
        }

        const blockListResult = await this.blockHistoryService.listByCriteria(
            this.getListingPage(request),
            this.getListingOrder(request),
            { generatorPublicKey: delegate.publicKey },
        );

        return this.toPagination(blockListResult, BlockResource, request.query.transform);
    }

    public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (delegate instanceof Boom) {
            return delegate;
        }

        const wallets = this.walletRepository.search(Contracts.State.SearchScope.Wallets, {
            ...request.query,
            ...{ vote: delegate.publicKey },
            ...this.getListingPage(request),
        });

        return this.toPagination(wallets, WalletResource);
    }

    private findWallet(id: string): Contracts.State.Wallet | Boom<null> {
        let wallet: Contracts.State.Wallet | undefined;

        try {
            wallet = this.walletRepository.findByScope(Contracts.State.SearchScope.Wallets, id);
        } catch (error) {
            return notFound("Delegate not found");
        }

        if (!wallet.hasAttribute("delegate.username")) {
            return notFound("Delegate not found");
        }

        return wallet;
    }
}
