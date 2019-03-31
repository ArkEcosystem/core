import { app } from "@arkecosystem/core-container";
import { TransactionPool } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class TransactionsController extends Controller {
    protected transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");

    public constructor() {
        super();
    }

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.transactions.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.transactions.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const pagination = super.paginate(request);

            const transactions = this.transactionPool
                .getTransactions(pagination.offset, pagination.limit, 0)
                .map(transaction => ({
                    serialized: transaction,
                }));

            return super.respondWith({
                transactions: super.toCollection(request, transactions, "transaction"),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const transaction = this.transactionPool.getTransaction(request.query.id);

            if (!transaction) {
                return super.respondWith("Transaction not found", true);
            }

            return super.respondWith({
                transaction: super.toResource(
                    request,
                    {
                        serialized: transaction.serialized,
                    },
                    "transaction",
                ),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
