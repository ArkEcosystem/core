import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    BlockCriteria,
    DbBlockResourceService,
    DposDelegate,
    DposDelegateCriteria,
    DposDelegatesPage,
    DposService,
    SomeBlockResourcesPage,
    WalletCriteria,
    WalletService,
    WalletsPage,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class DelegatesController extends Controller {
    @Container.inject(Identifiers.DposDelegateService)
    private readonly dposDelegateService!: DposService;

    @Container.inject(Identifiers.WalletService)
    private readonly walletService!: WalletService;

    @Container.inject(Identifiers.DbBlockResourceService)
    private readonly blockService!: DbBlockResourceService;

    public index(request: Hapi.Request): DposDelegatesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as DposDelegateCriteria;

        return this.dposDelegateService.getDelegatesPage(pagination, ordering, criteria);
    }

    public search(request: Hapi.Request): DposDelegatesPage {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = request.payload as DposDelegateCriteria;

        return this.dposDelegateService.getDelegatesPage(pagination, ordering, criteria);
    }

    public show(request: Hapi.Request): DposDelegate | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.dposDelegateService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        return delegate;
    }

    public voters(request: Hapi.Request): WalletsPage | Boom {
        const delegateId = request.params.id as string;
        const delegate = this.dposDelegateService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as WalletCriteria;

        return this.walletService.getActiveWalletsPage(pagination, ordering, criteria, {
            attributes: {
                vote: delegate.publicKey,
            },
        });
    }

    public async blocks(request: Hapi.Request): Promise<SomeBlockResourcesPage | Boom> {
        const delegateId = request.params.id as string;
        const delegate = this.dposDelegateService.getDelegate(delegateId);

        if (!delegate) {
            return notFound("Delegate not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.transform as boolean;
        const criteria = this.getCriteria(request) as BlockCriteria;

        return this.blockService.getBlocksPage(pagination, ordering, transform, criteria, {
            generatorPublicKey: delegate.publicKey,
        });
    }
}
