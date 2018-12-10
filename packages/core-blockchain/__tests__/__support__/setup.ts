import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-p2p",
        exclude: ["@arkecosystem/core-blockchain"],
    });

    return app;
};

export const tearDown = async () => {
    await app.tearDown();
};
