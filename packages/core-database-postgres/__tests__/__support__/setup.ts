import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUp = async () =>
    setUpContainer({
        exit: "@arkecosystem/core-database-postgres",
    });

export const tearDown = async () => {
    await app.tearDown();
};
