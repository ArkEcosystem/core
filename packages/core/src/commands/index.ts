import { app } from "@arkecosystem/core-container";

export async function startRelay(options, version) {
  return app.setUp(version, options, {
    exclude: ["@arkecosystem/core-forger"],
    options: {
      "@arkecosystem/core-p2p": {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      "@arkecosystem/core-blockchain": {
        networkStart: options.networkStart,
      },
    },
  });
}

export async function startForger(options, version) {
  return app.setUp(version, options, {
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
        address: options.address,
        password: options.password || process.env.ARK_FORGER_PASSWORD,
      },
    },
  });
}

export async function startRelayAndForger(options, version) {
  return app.setUp(version, options, {
    options: {
      "@arkecosystem/core-p2p": {
        networkStart: options.networkStart,
        disableDiscovery: options.disableDiscovery,
        skipDiscovery: options.skipDiscovery,
      },
      "@arkecosystem/core-blockchain": {
        networkStart: options.networkStart,
      },
      "@arkecosystem/core-forger": {
        bip38: options.bip38 || process.env.ARK_FORGER_BIP38,
        address: options.address,
        password: options.password || process.env.ARK_FORGER_PASSWORD,
      },
    },
  });
}
