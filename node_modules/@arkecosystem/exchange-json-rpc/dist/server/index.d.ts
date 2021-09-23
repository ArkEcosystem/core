import { Server } from "@hapi/hapi";
export declare function startServer(options: Record<string, string | number | boolean>, onlyCreate?: boolean): Promise<Server>;
