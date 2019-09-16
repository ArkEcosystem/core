import { app, Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Controller } from "../shared/controller";

export class TransactionsController extends Controller {
    private readonly transactionPool = app.get<Contracts.TransactionPool.Connection>(
        Container.Identifiers.TransactionPoolService,
    );

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
            const processor: Contracts.TransactionPool.Processor = this.transactionPool.makeProcessor();
            const result = await processor.validate((request.payload as any).transactions);

            if (result.broadcast.length > 0) {
                app.get<Contracts.P2P.NetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).broadcastTransactions(
                    processor.getBroadcastTransactions(),
                );
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
            const pagination = super.paginate(request);

            const data = (await this.transactionPool.getTransactions(pagination.offset, pagination.limit)).map(
                transaction => ({
                    serialized: transaction.toString("hex"),
                }),
            );

            return super.toPagination(
                {
                    count: await this.transactionPool.getPoolSize(),
                    rows: data,
                },
                "transaction",
                (request.query.transform as unknown) as boolean,
            );
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const transaction: Interfaces.ITransaction = await this.transactionPool.getTransaction(request.params.id);

            if (!transaction) {
                return Boom.notFound("Transaction not found");
            }

            const data = { id: transaction.id, serialized: transaction.serialized.toString("hex") };

            return super.respondWithResource(data, "transaction", (request.query.transform as unknown) as boolean);
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
            // Remove reverse mapping from TransactionType enum.
            const { TransactionType } = Enums;
            const data = Object.assign({}, TransactionType);

            Object.values(TransactionType)
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
