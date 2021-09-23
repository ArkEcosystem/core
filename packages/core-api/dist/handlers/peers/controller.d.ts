import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class PeersController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<object>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
