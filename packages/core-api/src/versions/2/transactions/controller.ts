import { app } from "@arkecosystem/core-container";
import { P2P } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

import { TransactionGuard, TransactionPool } from "@arkecosystem/core-transaction-pool";
import { constants } from "@arkecosystem/crypto";

export class TransactionsController extends Controller {
    private transactionPool = app.resolvePlugin<TransactionPool>("transactionPool");

    public constructor() {
        super();
    }

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async store(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            if (!this.transactionPool.options.enabled) {
                return Boom.serverUnavailable("Transaction pool is disabled.");
            }

            const guard = new TransactionGuard(this.transactionPool);

            const result = await guard.validate((request.payload as any).transactions);

            if (result.broadcast.length > 0) {
                app.resolvePlugin<P2P.IMonitor>("p2p").broadcastTransactions(guard.getBroadcastTransactions());
            }

            return {
                data: {
                    accept: result.accept,
                    broadcast: result.broadcast,
                    excess: result.excess,
                    invalid: result.invalid,
                },
                errors: result.errors,
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            if (!this.transactionPool.options.enabled) {
                return Boom.serverUnavailable("Transaction pool is disabled.");
            }

            const pagination = super.paginate(request);

            let transactions = this.transactionPool.getTransactions(pagination.offset, pagination.limit, 0);
            transactions = transactions.map(transaction => ({
                serialized: transaction,
            }));

            return super.toPagination(
                request,
                {
                    count: this.transactionPool.getPoolSize(),
                    rows: transactions,
                },
                "transaction",
            );
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            if (!this.transactionPool.options.enabled) {
                return Boom.serverUnavailable("Transaction pool is disabled.");
            }

            let transaction = this.transactionPool.getTransaction(request.params.id);

            if (!transaction) {
                return Boom.notFound("Transaction not found");
            }

            transaction = { serialized: transaction.serialized };

            return super.respondWithResource(request, transaction, "transaction");
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.transactions.search(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async types(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // Remove reverse mapping from TransactionTypes enum.
            const { TransactionTypes } = constants;
            const data = Object.assign({}, TransactionTypes);
            Object.values(TransactionTypes)
                .filter(value => typeof value === "string")
                .map((type: string) => data[type])
                .forEach((key: string) => delete data[key]);

            return { data };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fees(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return {
                data: this.config.getMilestone(this.blockchain.getLastHeight()).fees.staticFees,
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
