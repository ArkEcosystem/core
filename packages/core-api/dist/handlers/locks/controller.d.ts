import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class LocksController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    search(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    unlocked(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
