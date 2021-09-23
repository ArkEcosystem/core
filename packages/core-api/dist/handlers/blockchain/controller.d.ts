import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class BlockchainController extends Controller {
    index(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: {
            block: {
                height: number;
                id: string;
            };
            supply: string;
        };
    }>;
}
