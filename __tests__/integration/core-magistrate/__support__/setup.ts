import { app } from "@arkecosystem/core-container";
import { asValue } from "awilix";
import { defaults as defaultsBlockchain } from "../../../../packages/core-blockchain/src/defaults";
import { defaults as defaultsPool } from "../../../../packages/core-transaction-pool/src/defaults";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";
import { transactionPoolConfig } from "../fixtures/transaction-pool";
jest.setTimeout(60000);

export const setUp = async () => {
    try {
        return await setUpContainer({
            exit: "@arkecosystem/core-blockchain",
            exclude: ["@arkecosystem/core-transaction-pool"],
            network: "unitnet",
        });
    } catch (error) {
        console.error(error.stack);
        return undefined;
    }
};

export const setUpFull = async () => {
    process.env.CORE_RESET_DATABASE = "1";

    try {
        await setUpContainer({
            exit: "@arkecosystem/core-transaction-pool",
            exclude: ["@arkecosystem/core-transaction-pool"],
            network: "unitnet",
        });

        app.register("pkg.transaction-pool.opts", asValue(defaultsPool));

        await registerWithContainer(
            require("../../../../packages/core-transaction-pool/src/plugin").plugin,
            transactionPoolConfig,
        );

        app.register("pkg.blockchain.opts", asValue(defaultsBlockchain));

        await registerWithContainer(require("@arkecosystem/core-blockchain").plugin, {});

        return app;
    } catch (error) {
        console.error(error.stack);
        return undefined;
    }
};

export const tearDown = async () => {
    await app.tearDown();
};

export const tearDownFull = async () => {
    await require("../../../../packages/core-transaction-pool/src/plugin").plugin.deregister(
        app,
        transactionPoolConfig,
    );
    await require("@arkecosystem/core-blockchain").plugin.deregister(app, {});

    await app.tearDown();
};
