import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class BlocksController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    first(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    last(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    transactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
