import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
    process.env.CORE_GRAPHQL_ENABLED = "true";

    await setUpContainer({
        exclude: ["@arkecosystem/core-api", "@arkecosystem/core-forger"],
    });

    return app;
};

export const tearDown = async () => {
    await app.tearDown();
};
