import { app, Container } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
    return await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
        exclude: ["@arkecosystem/core-transaction-pool"],
    });
};

export const setUpFull = async () => {
    return await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });
};

export const tearDown = async () => {
    await app.tearDown();
};
