import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class DelegatesController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    blocks(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    voters(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
