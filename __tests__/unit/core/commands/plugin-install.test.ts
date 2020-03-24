import "jest-extended";

import { Command } from "@packages/core/src/commands/plugin-install";
import { Console } from "@arkecosystem/core-test-framework";

import { setGracefulCleanup } from "tmp";


let cli;
beforeEach(() => {

    cli = new Console();
});


afterEach(() => setGracefulCleanup());

describe("PluginInstallCommand", () => {
        it.only("should successfully install the plugin", async () => {
            // mock npm git, file
            
            // Act
            await cli.withArgs({package: "@arkecosystem/utils"}).execute(Command);

            // expect that they exist has been call, and that install has been called with package
        });
});
