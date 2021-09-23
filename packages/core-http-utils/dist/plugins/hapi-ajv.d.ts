import Hapi from "@hapi/hapi";
export declare const hapiAjv: {
    name: string;
    version: string;
    register: (server: Hapi.Server, options: any) => Promise<void>;
};
