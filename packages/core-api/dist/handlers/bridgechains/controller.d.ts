import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class BridgechainController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
