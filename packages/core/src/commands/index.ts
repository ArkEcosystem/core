import { app } from "@arkecosystem/core-kernel";
import { buildPeerOptions } from "../utils";

export async function startRelay(options, version) {
    await app.setUp(version, options, {
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

export async function startForger(options, version) {
    await app.setUp(version, options, {
        include: [
            "@arkecosystem/core-event-emitter",
            "@arkecosystem/core-logger",
            "@arkecosystem/core-logger-winston",
            "@arkecosystem/core-forger",
        ],
        options: {
            "@arkecosystem/core-forger": {
                bip38: options.bip38 || process.env.CORE_FORGER_BIP38,
                address: options.address,
                password: options.password || process.env.CORE_FORGER_PASSWORD,
            },
        },
        skipPlugins: options.skipPlugins,
    });

    return app;
}

export async function startRelayAndForger(options, version) {
    await app.setUp(version, options, {
        options: {
            "@arkecosystem/core-p2p": buildPeerOptions(options),
            "@arkecosystem/core-blockchain": {
                networkStart: options.networkStart,
            },
            "@arkecosystem/core-forger": {
                bip38: options.bip38 || process.env.CORE_FORGER_BIP38,
                address: options.address,
                password: options.password || process.env.CORE_FORGER_PASSWORD,
            },
        },
        skipPlugins: options.skipPlugins,
    });

    return app;
}
