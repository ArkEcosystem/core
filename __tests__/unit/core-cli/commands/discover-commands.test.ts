import { Console } from "@arkecosystem/core-test-framework";
import { setGracefulCleanup } from "tmp";
import { resolve } from "path";

import { DiscoverCommands } from "@packages/core-cli/src/commands";

let cli;
let cmd;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(DiscoverCommands);
});

describe("DiscoverCommands", () => {
    it("should discover commands within the given directory", () => {
        const commandPath: string = resolve(__dirname, "../../../../packages/core/dist/commands");

        const commands = cmd.within(commandPath);

        expect(commands).toBeObject();
        expect(commands).not.toBeEmpty();
    });
});
