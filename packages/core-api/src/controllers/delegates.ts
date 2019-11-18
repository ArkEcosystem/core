import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BlockResource, DelegateResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = this.databaseService.wallets.search(Contracts.Database.SearchScope.Delegates, {
            ...request.query,
            ...this.paginate(request),
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
        const delegates = this.databaseService.wallets.search(Contracts.Database.SearchScope.Delegates, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(delegates, DelegateResource);
    }

    public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (delegate instanceof Boom) {
            return delegate;
        }

        const rows = await this.databaseService.blocksBusinessRepository.findAllByGenerator(
            delegate.publicKey!,
            this.paginate(request),
        );

        return this.toPagination(rows, BlockResource, request.query.transform);
    }

    public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegate: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (delegate instanceof Boom) {
            return delegate;
        }

        const wallets = this.databaseService.wallets.search(Contracts.Database.SearchScope.Wallets, {
            ...request.query,
            ...{ vote: delegate.publicKey },
            ...this.paginate(request),
        });

        return this.toPagination(wallets, WalletResource);
    }

    private findWallet(id: string): Contracts.State.Wallet | Boom<null> {
        let wallet: Contracts.State.Wallet | undefined;

        try {
            wallet = this.databaseService.wallets.findById(Contracts.Database.SearchScope.Wallets, id);
        } catch (error) {
            return Boom.notFound("Delegate not found");
        }

        if (!wallet.hasAttribute("delegate.username")) {
            return Boom.notFound("Delegate not found");
        }

        return wallet;
    }
}
