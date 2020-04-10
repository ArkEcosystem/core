import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { LockResource, TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    protected readonly databaseTransactionService!: Contracts.Database.TransactionService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const locks = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            ...request.query,
            ...this.getListPage(request),
        });

        return this.toPagination(locks, LockResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const lock = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            lockId: request.params.id,
        }).rows[0];

        if (!lock) {
            return Boom.notFound("Lock not found");
        }

        return this.respondWithResource(lock, LockResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const locks = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            ...request.payload,
            ...request.query,
            ...this.getListPage(request),
        });

        return this.toPagination(locks, LockResource);
    }

    public async unlocked(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactionListResult = await this.databaseTransactionService.listHtlcClaimRefundByLockIds(
            request.payload.ids,
            this.getListOrder(request),
            this.getListPage(request),
        );

        return this.toPagination(transactionListResult, TransactionResource);
    }
}
