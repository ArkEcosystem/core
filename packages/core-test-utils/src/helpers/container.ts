import { app } from "@arkecosystem/core-container";
import { Container } from "@arkecosystem/core-interfaces";
import "@arkecosystem/core-jest-matchers";
import * as path from "path";

export async function setUpContainer(options: any): Promise<Container.IContainer> {
    options.network = options.network || "testnet";
    await app.setUp(
        "2.0.0",
        {
            data: options.data || "~/.core",
            config: options.config ? options.config : path.resolve(__dirname, `../config/${options.network}`),
            token: options.token || "ark",
            network: options.network,
        },
        options,
    );
    return app;
}
