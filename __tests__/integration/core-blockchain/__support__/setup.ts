import { app } from "@arkecosystem/core-container";
import { asValue } from "awilix";
import { defaults } from "../../../../packages/core-blockchain/src/defaults";
import { plugin } from "../../../../packages/core-blockchain/src/plugin";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

export async function setUpFull() {
    await setUpContainer({ exit: "@arkecosystem/core-p2p" });

    app.register("pkg.blockchain.opts", asValue(defaults));

    await registerWithContainer(plugin, {});

    return app;
}

export async function tearDownFull(): Promise<void> {
    await plugin.deregister(app, {});

    await app.tearDown();
}

export async function setUp() {
    await setUpContainer({ exit: "@arkecosystem/core-p2p" });

    app.register("pkg.blockchain.opts", asValue(defaults));

    return app;
}

export async function tearDown(): Promise<void> {
    await app.tearDown();
}
