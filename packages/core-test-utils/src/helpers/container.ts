import { app, Container } from "@arkecosystem/core-container";
import "@arkecosystem/core-jest-matchers";
import * as path from "path";

export async function setUpContainer(options: any): Promise<Container> {
    await app.setUp(
        "2.0.0",
        {
            data: options.data || "~/.ark",
            config: options.config ? options.config : path.resolve(__dirname, "../config/testnet"),
            token: options.token || "ark",
            network: options.network || "testnet",
        },
        options,
    );
    return app;
}
