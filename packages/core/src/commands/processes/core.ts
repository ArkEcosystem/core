import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { buildPeerOptions } from "../../utils";

export async function start(options) {
    await app.setUp(options.parent._version, options, {
        options: {
            "@arkecosystem/core-p2p": buildPeerOptions(options),
            "@arkecosystem/core-blockchain": {
                networkStart: options.networkStart,
            },
            "@arkecosystem/core-forger": {
                bip38: options.bip38 || process.env.ARK_FORGER_BIP38,
                password: options.password || process.env.ARK_FORGER_PASSWORD,
            },
        },
        skipPlugins: options.skipPlugins,
    });

    return app;
}

export async function stop() {
    pm2.stop("ark-core");
}

export async function restart() {
    pm2.reload("ark-core");
}

export async function monitor(options) {
    pm2.start({
        name: "ark-core",
        script: "./dist/index.js",
        args: `start --data ${options.data} --config ${options.config}`,
        env: {
            ARK_FORGER_BIP38: options.bip38,
            ARK_FORGER_PASSWORD: options.password,
        },
    });
}
