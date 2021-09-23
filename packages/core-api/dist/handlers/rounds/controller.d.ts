import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class RoundsController extends Controller {
    delegates(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<any>;
}
