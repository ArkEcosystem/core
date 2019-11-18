import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { LockResource, TransactionResource, WalletResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class WalletsController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.toPagination(
            this.databaseService.wallets.search(Contracts.Database.SearchScope.Wallets, {
                ...request.query,
                ...this.paginate(request),
            }),
            WalletResource,
        );
    }

    public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return this.toPagination(
            this.databaseService.wallets.top(Contracts.Database.SearchScope.Wallets, this.paginate(request)),
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

        // Overwrite parameters for special wallet treatment inside transaction repository
        const parameters = {
            ...request.query,
            ...request.params,
            ...this.paginate(request),
            walletPublicKey: wallet.publicKey,
            walletAddress: wallet.address,
        };

        delete parameters.publicKey;
        delete parameters.recipientId;
        delete parameters.id;

        const rows = await this.databaseService.transactionsBusinessRepository.search(parameters);

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        // NOTE: We unset this value because it otherwise will produce a faulty SQL query
        delete request.params.id;

        const rows = await this.databaseService.transactionsBusinessRepository.findAllBySender(wallet.publicKey!, {
            ...request.query,
            ...request.params,
            ...this.paginate(request),
        });

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        // NOTE: We unset this value because it otherwise will produce a faulty SQL query
        delete request.params.id;

        const rows = await this.databaseService.transactionsBusinessRepository.findAllByRecipient(wallet.address, {
            ...request.query,
            ...request.params,
            ...this.paginate(request),
        });

        return this.toPagination(rows, TransactionResource, (request.query.transform as unknown) as boolean);
    }

    public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallet: Contracts.State.Wallet | Boom<null> = this.findWallet(request.params.id);

        if (wallet instanceof Boom) {
            return wallet;
        }

        // NOTE: We unset this value because it otherwise will produce a faulty SQL query
        delete request.params.id;

        const rows = await this.databaseService.transactionsBusinessRepository.allVotesBySender(wallet.publicKey!, {
            ...request.params,
            ...this.paginate(request),
        });

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

        const rows = this.databaseService.wallets.search(Contracts.Database.SearchScope.Locks, {
            ...request.params,
            ...request.query,
            ...this.paginate(request),
            senderPublicKey: wallet.publicKey,
        });

        return this.toPagination(rows, LockResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const wallets = this.databaseService.wallets.search(Contracts.Database.SearchScope.Wallets, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(wallets, WalletResource);
    }

    private findWallet(id: string): Contracts.State.Wallet | Boom<null> {
        let wallet: Contracts.State.Wallet | undefined;

        try {
            wallet = this.databaseService.wallets.findById(Contracts.Database.SearchScope.Wallets, id);
        } catch (error) {
            return Boom.notFound("Wallet not found");
        }

        return wallet;
    }
}
