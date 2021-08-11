import { Application, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import { ServiceProvider } from "@packages/core-magistrate-api/src";
import { Sandbox } from "@packages/core-test-framework/src";
import { EventEmitter } from "events";
import { resolve } from "path";

EventEmitter.prototype.constructor = Object.prototype.constructor;

const sandbox: Sandbox = new Sandbox();

export const setUp = async (): Promise<Application> => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
        },
        peers: {
            list: [{ ip: "127.0.0.1", port: 4000 }], // need some peers defined for the app to run
        },
    });

    await sandbox
        .withCoreOptions({
            app: {
                core: {
                    plugins: [
                        { package: "@arkecosystem/core-state" },
                        { package: "@arkecosystem/core-database" },
                        { package: "@arkecosystem/core-transactions" },
                        { package: "@arkecosystem/core-magistrate-transactions" },
                        { package: "@arkecosystem/core-transaction-pool" },
                        { package: "@arkecosystem/core-p2p" },
                        { package: "@arkecosystem/core-blockchain" },
                        { package: "@arkecosystem/core-api" },
                        { package: "@arkecosystem/core-forger" },
                    ],
                },
                relay: {
                    plugins: [
                        { package: "@arkecosystem/core-state" },
                        { package: "@arkecosystem/core-database" },
                        { package: "@arkecosystem/core-transactions" },
                        { package: "@arkecosystem/core-magistrate-transactions" },
                        { package: "@arkecosystem/core-transaction-pool" },
                        { package: "@arkecosystem/core-p2p" },
                        { package: "@arkecosystem/core-blockchain" },
                        { package: "@arkecosystem/core-api" },
                    ],
                },
                forger: {
                    plugins: [{ package: "@arkecosystem/core-forger" }],
                },
            },
        })
        .boot(async ({ app }) => {
            await app.bootstrap({
                flags: {
                    token: "ark",
                    network: "unitnet",
                    env: "test",
                    processType: "core",
                },
            });

            // We need to manually register the service provider from source so that jest can collect coverage.
            sandbox.registerServiceProvider({
                name: "@arkecosystem/core-magistrate-api",
                path: resolve(__dirname, "../../../../packages/core-magistrate-api"),
                klass: ServiceProvider,
            });

            Managers.configManager.getMilestone().aip11 = false;
            Managers.configManager.getMilestone().htlcEnabled = false;

            await app.boot();

            Managers.configManager.getMilestone().aip11 = true;
            Managers.configManager.getMilestone().htlcEnabled = true;

            await AppUtils.sleep(1000); // give some more time for api server to be up
        });

    return sandbox.app;
};

export const tearDown = async (): Promise<void> => {
    await sandbox.dispose();
};
