import { Server } from "@hapi/hapi";
export * from "./interfaces";
export declare const start: (options: {
    database: string;
    server: Record<string, any>;
    logger?: any;
}) => Promise<Server>;
