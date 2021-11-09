import { Console } from "@packages/core-test-framework";
import { CommandHelp } from "@packages/core-cli/src/commands";
import { setGracefulCleanup } from "tmp";

import { Command } from "./__stubs__/command";
import { CommandWithoutDefinition } from "./__stubs__/command-without-definition";

let cli;
let cmd;

beforeAll(() => setGracefulCleanup());

beforeEach(() => {
    cli = new Console();

    cmd = cli.app.resolve(CommandHelp);
});

describe("CommandHelp", () => {
    it("should render the help if a command has arguments and flags", () => {
        expect(cmd.render(cli.app.resolve(Command))).toBeString();
    });

    it("should render the help if a command does not have arguments or flags", () => {
        expect(cmd.render(cli.app.resolve(CommandWithoutDefinition))).toBeString();
    });
});
