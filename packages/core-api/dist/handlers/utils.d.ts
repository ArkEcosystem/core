import Hapi from "@hapi/hapi";
export declare const paginate: (request: Hapi.Request) => any;
export declare const respondWithResource: (data: any, transformer: any, transform?: boolean) => object;
export declare const respondWithCollection: (data: any, transformer: any, transform?: boolean) => object;
export declare const respondWithCache: (data: any, h: any) => any;
export declare const toResource: (data: any, transformer: any, transform?: boolean) => object;
export declare const toCollection: (data: any, transformer: any, transform?: boolean) => object;
export declare const toPagination: (data: any, transformer: any, transform?: boolean) => object;
