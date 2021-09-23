import { TransactionPool } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class TransactionsController extends Controller {
    private readonly transactionPool;
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    store(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: {
            accept: string[];
            broadcast: string[];
            excess: string[];
            invalid: string[];
        };
        errors: {
            [key: string]: TransactionPool.ITransactionErrorResponse[];
        };
    }>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object>;
    showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    types(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: Record<string | number, Record<string, number>>;
    }>;
    schemas(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: Record<string, Record<string, any>>;
    }>;
    fees(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: Record<string | number, Record<string, string>>;
    }>;
}
