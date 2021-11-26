// Based on https://github.com/fknop/hapi-pagination

import Hapi from "@hapi/hapi";

import { getConfig } from "./config";
import { Ext } from "./ext";

export const pagination: Hapi.Plugin<any> = {
    name: "hapi-pagination",
    version: "1.0.0",
    register(server, options) {
        const { error, config } = getConfig(options);

        if (error) {
            throw error;
        }

        const ext = new Ext(config);

        server.ext("onPreHandler", (request, h) => ext.onPreHandler(request, h));
        server.ext("onPostHandler", (request, h) => ext.onPostHandler(request, h));
    },
};
