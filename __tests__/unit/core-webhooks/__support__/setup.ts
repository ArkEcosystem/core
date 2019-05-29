import { app } from "@arkecosystem/core-container";
import { tmpdir } from "os";
import { database } from "../../../../packages/core-webhooks/src/database";
import { startServer } from "../../../../packages/core-webhooks/src/server";

export const setUp = async () => {
    process.env.CORE_PATH_CACHE = tmpdir();

    app.resolvePlugin = jest.fn().mockReturnValue(console);

    database.make();

    return startServer({
        host: "0.0.0.0",
        port: 4004,
        whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
    });
};
