import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUpFull = async () =>
    setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });

export const setUp = async () =>
    setUpContainer({
        exit: "@arkecosystem/core-p2p",
        exclude: ["@arkecosystem/core-blockchain"],
    });

export const tearDown = async () => {
    await app.tearDown();
};
