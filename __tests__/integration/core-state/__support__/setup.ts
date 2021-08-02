import { Application, Container, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";
import { EventEmitter } from "events";

EventEmitter.prototype.constructor = Object.prototype.constructor;

const sandbox: Sandbox = new Sandbox();

const transactionPoolQuery = null;
const transactionPoolService = null;
const peerNetworkMonitor = {
    boot: jest.fn(),
    cleansePeers: jest.fn(),
};
const peerRepository = null;

export const setUp = async (): Promise<Application> => {
    jest.setTimeout(60000);

    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
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
                        { package: "@arkecosystem/core-blockchain" },
                    ],
                },
                relay: { plugins: [] },
                forger: { plugins: [] },
            },
        })
        .boot(async ({ app }) => {
            app.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(transactionPoolQuery);
            app.bind(Container.Identifiers.TransactionPoolService).toConstantValue(transactionPoolService);
            app.bind(Container.Identifiers.PeerNetworkMonitor).toConstantValue(peerNetworkMonitor);
            app.bind(Container.Identifiers.PeerRepository).toConstantValue(peerRepository);

            await app.bootstrap({
                flags: {
                    token: "ark",
                    network: "unitnet",
                    env: "test",
                    processType: "core",
                },
            });

            Managers.configManager.getMilestone().aip11 = false;
            Managers.configManager.getMilestone().htlcEnabled = false;

            await app.boot();

            Managers.configManager.getMilestone().aip11 = true;
            Managers.configManager.getMilestone().aip37 = true;
            Managers.configManager.getMilestone().htlcEnabled = true;

            await AppUtils.sleep(1000);
        });

    return sandbox.app;
};

export const tearDown = async (): Promise<void> => {
    await sandbox.dispose();
};
