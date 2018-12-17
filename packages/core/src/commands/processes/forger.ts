import { app } from "@arkecosystem/core-container";
import * as pm2 from "../../pm2";
import { buildPeerOptions } from "../../utils";

export async function start(options) {
    await app.setUp(options.parent._version, options, {
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-config",
            "@arkecosystem/core-logger",
            "@arkecosystem/core-logger-winston",
            "@arkecosystem/core-forger",
        ],
        options: {
            "@arkecosystem/core-forger": {
                bip38: options.bip38 || process.env.ARK_FORGER_BIP38,
                password: options.password || process.env.ARK_FORGER_PASSWORD,
            },
        },
        skipPlugins: options.skipPlugins,
    });

    return app;
}

export async function stop(options) {
    pm2.stop("ark-core-forger");
}

export async function restart(options) {
    pm2.reload("ark-core-forger");
}

export async function monitor(options) {
    pm2.start({
        name: "ark-core-forger",
        script: "./dist/index.js",
        args: `forger --data ${options.data} --config ${options.config}`,
        env: {
            ARK_FORGER_BIP38: options.bip38,
            ARK_FORGER_PASSWORD: options.password,
        },
    });
}
