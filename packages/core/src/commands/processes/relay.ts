import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { buildPeerOptions } from "../../utils";

export async function start(options) {
    await app.setUp(options.parent._version, options, {
        exclude: ["@arkecosystem/core-forger"],
        options: {
            "@arkecosystem/core-p2p": buildPeerOptions(options),
            "@arkecosystem/core-blockchain": {
                networkStart: options.networkStart,
            },
        },
        skipPlugins: options.skipPlugins,
    });

    return app;
}

export async function stop() {
    pm2.stop("ark-core-relay");
}

export async function restart() {
    pm2.reload("ark-core-relay");
}

export async function monitor(options) {
    pm2.start({
        name: "ark-core-relay",
        script: "./dist/index.js",
        args: `relay:start --data ${options.data} --config ${options.config}`,
    });
}
