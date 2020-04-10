import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BlockResource, DelegateResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseBlockService)
    protected readonly databaseBlockService!: Contracts.Database.BlockService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = this.walletRepository.search(Contracts.State.SearchScope.Delegates, {
            ...request.query,
            ...this.getListPage(request),
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
            ...this.getListPage(request),
        });

        return this.toPagination(delegates, DelegateResource);
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (delegate instanceof Boom) {
            return delegate;
        }

        const blockListResult = await this.databaseBlockService.listByGeneratorPublicKey(
            delegate.publicKey!,
            this.getListOrder(request),
            this.getListPage(request),
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
            ...this.getListPage(request),
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
