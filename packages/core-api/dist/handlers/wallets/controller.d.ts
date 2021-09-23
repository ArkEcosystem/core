import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class WalletsController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    top(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    transactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    votes(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    locks(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
