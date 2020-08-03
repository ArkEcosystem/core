import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    BlockCriteria,
    BlockResourceDbProvider,
    DelegateCriteria,
    DelegateResource,
    DelegateResourceProvider,
    DelegateResourcesPage,
    SomeBlockResourcesPage,
    WalletCriteria,
    WalletResourceProvider,
    WalletResourcesPage,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Identifiers.BlockResourceDbProvider)
    private readonly blockResourceDbProvider!: BlockResourceDbProvider;

    @Container.inject(Identifiers.WalletResourceProvider)
    private readonly walletResourceProvider!: WalletResourceProvider;

    @Container.inject(Identifiers.DelegateResourceProvider)
    private readonly delegateResourceProvider!: DelegateResourceProvider;

    public index(request: Hapi.Request): DelegateResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as DelegateCriteria;

        return this.delegateResourceProvider.getDelegatesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): DelegateResourcesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as DelegateCriteria;

        return this.delegateResourceProvider.getDelegatesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): DelegateResource | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.delegateResourceProvider.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        return delegate;
    }

    public voters(request: Hapi.Request): WalletResourcesPage | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.delegateResourceProvider.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as WalletCriteria;

        return this.walletResourceProvider.getActiveWalletsPage(pagination, ordering, criteria, {
            attributes: {
                vote: delegate.publicKey,
            },
        });
    }

    public async blocks(request: Hapi.Request): Promise<SomeBlockResourcesPage | Boom> {
        const delegateId = request.params.id as string;
        const delegate = this.delegateResourceProvider.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.transform as boolean;
        const criteria = this.getCriteria(request) as BlockCriteria;

        return this.blockResourceDbProvider.getBlocksPage(pagination, ordering, transform, criteria, {
            generatorPublicKey: delegate.publicKey,
        });
    }
}
