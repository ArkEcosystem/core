import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import deepmerge from "deepmerge";
import expandHomeDir from "expand-home-dir";
import { readFileSync } from "fs";

import { monitorServer } from "./monitor";

export const createServer = async (options, callback?: any, plugins?: any[]) => {
    if (options.tls) {
        options.tls.key = readFileSync(expandHomeDir(options.tls.key)).toString();
        options.tls.cert = readFileSync(expandHomeDir(options.tls.cert)).toString();
    }

    options = deepmerge(
        {
            routes: {
                payload: {
                    async failAction(request, h, err) {
                        return Boom.badData(err.message);
                    },
                },
                validate: {
                    async failAction(request, h, err) {
                        return Boom.badData(err.message);
                    },
                },
            },
        },
        options,
    );

    const server = new Hapi.Server(options);

    if (Array.isArray(plugins)) {
        for (const plugin of plugins) {
            await server.register(plugin);
        }
    }

    await server.register({
        plugin: require("hapi-trailing-slash"),
        options: { method: "remove" },
    });

    if (callback) {
        await callback(server);
    }

    if (process.env.NODE_ENV === "test") {
        await monitorServer(server);
    }

    return server;
};
