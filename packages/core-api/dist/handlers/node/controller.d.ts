import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";
export declare class NodeController extends Controller {
    status(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: {
            synced: boolean;
            now: number;
            blocksCount: number;
            timestamp: number;
        };
    }>;
    syncing(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: {
            syncing: boolean;
            blocks: number;
            height: number;
            id: string;
        };
    }>;
    configuration(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Boom.Boom<unknown> | {
        data: {
            core: {
                version: string;
            };
            nethash: any;
            slip44: any;
            wif: any;
            token: any;
            symbol: any;
            explorer: any;
            version: any;
            ports: object;
            constants: any;
            transactionPool: {
                dynamicFees: any;
            };
        };
    }>;
    configurationCrypto(): Promise<Boom.Boom<unknown> | {
        data: import("@arkecosystem/crypto/dist/interfaces").INetworkConfig;
    }>;
    fees(request: Hapi.Request): Promise<{
        meta: {
            days: string | string[];
        };
        data: {};
    }>;
    debug(request: Hapi.Request, h: any): Promise<any>;
}
