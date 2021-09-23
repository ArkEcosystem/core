import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class VotesController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
    show(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
