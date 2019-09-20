import { app } from "@arkecosystem/core-container";
import { Managers } from "@arkecosystem/crypto";
import { plugin } from "../../../../packages/core-database-postgres/src/plugin";
import { plugin as pluginDatabase } from "../../../../packages/core-database/src/plugin";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

export const setUp = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-database-postgres",
        exclude: ["@arkecosystem/core-database-postgres"],
    });

    process.env.CORE_RESET_DATABASE = "1";

    Managers.configManager.getMilestone().aip11 = false;

    await registerWithContainer(pluginDatabase);

    await registerWithContainer(plugin, {
        connection: {
            host: "localhost",
            port: 5432,
            database: "ark_unitnet",
            user: "ark",
            password: "password",
        },
    });
};

export const tearDown = async () => {
    await app.tearDown();

    await plugin.deregister(app);
};
