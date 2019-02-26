import { app } from "@arkecosystem/core-container";
import "../../../utils";
import { setUpContainer } from "../../../utils/helpers/container";

export const setUp = async () => {
    jest.setTimeout(60000);

    process.env.CORE_SKIP_BLOCKCHAIN = "true";

    return await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
        exclude: [
            "@arkecosystem/core-p2p",
            "@arkecosystem/core-transaction-pool",
            "@arkecosystem/core-database-postgres",
        ],
    });
};

export const tearDown = async () => {
    await app.tearDown();
};
