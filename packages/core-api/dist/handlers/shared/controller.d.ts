import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import Hapi from "@hapi/hapi";
export declare class Controller {
    protected readonly config: any;
    protected readonly blockchain: Blockchain.IBlockchain;
    protected readonly databaseService: Database.IDatabaseService;
    protected paginate(request: Hapi.Request): any;
    protected respondWithResource(data: any, transformer: any, transform?: boolean): any;
    protected respondWithCollection(data: any, transformer: any, transform?: boolean): object;
    protected respondWithCache(data: any, h: any): any;
    protected toResource(data: any, transformer: any, transform?: boolean): object;
    protected toCollection(data: any, transformer: any, transform?: boolean): object;
    protected toPagination(data: any, transformer: any, transform?: boolean): object;
}
