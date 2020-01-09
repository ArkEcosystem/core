import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { LockResource, TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class LocksController extends Controller {
    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const locks = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            ...request.query,
            ...this.paginate(request),
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
            ...this.paginate(request),
        });

        return this.toPagination(locks, LockResource);
    }

    public async unlocked(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const transactions = await this.transactionRepository.findByHtlcLocks(request.payload.ids);

        return this.toPagination(
            {
                count: transactions.length,
                rows: transactions,
            },
            TransactionResource,
        );
    }
}
