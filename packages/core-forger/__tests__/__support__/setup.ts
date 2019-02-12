import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

export const setUp = async () => {
    return setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });
};

export const tearDown = async () => {
    return app.tearDown();
};
