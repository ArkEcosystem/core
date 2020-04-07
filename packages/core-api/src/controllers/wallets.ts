import { Repositories } from "@arkecosystem/core-database";
import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/crypto";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { LockResource, TransactionResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Application;

    @Container.inject(Container.Identifiers.BlockRepository)
    protected readonly blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    protected readonly databaseTransactionService!: Contracts.Database.TransactionService;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.toPagination(
            this.walletRepository.search(Contracts.State.SearchScope.Wallets, {
                ...request.query,
                ...this.paginate(request),
            }),
            WalletResource,
        );
    }

    public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.toPagination(
            this.walletRepository.top(Contracts.State.SearchScope.Wallets, this.paginate(request)),
            WalletResource,
        );
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.respondWithResource(this.findWallet(request.params.id), WalletResource);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        const rows = await this.databaseTransactionService.search(
            { ...request.query, wallet },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        const rows = await this.databaseTransactionService.search(
            { ...request.query, senderPublicKey: wallet.publicKey },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        const rows = await this.databaseTransactionService.search(
            { ...request.query, recipientId: wallet.address },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        const rows = await this.databaseTransactionService.search(
            {
                ...request.query,
                senderPublicKey: wallet.publicKey,
                typeGroup: Enums.TransactionTypeGroup.Core,
                type: Enums.TransactionType.Vote,
            },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async locks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        // Sorry, cold wallets
        if (!wallet.publicKey) {
            return this.toPagination({ rows: [], count: 0 }, LockResource);
        }

        const rows = this.walletRepository.search(Contracts.State.SearchScope.Locks, {
            ...request.params,
            ...request.query,
            ...this.paginate(request),
            senderPublicKey: wallet.publicKey,
        });

        return this.toPagination(rows, LockResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallets = this.walletRepository.search(Contracts.State.SearchScope.Wallets, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(wallets, WalletResource);
    }

    private findWallet(id: string): Contracts.State.Wallet | Boom<null> {
        try {
            return this.walletRepository.findByScope(Contracts.State.SearchScope.Wallets, id);
        } catch (error) {
            return notFound("Wallet not found");
        }
    }
}
