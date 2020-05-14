import "jest-extended";

import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/help";

let cli;
beforeEach(() => {
    cli = new Console();
});

describe("HelpCommand", () => {
    it("should render a table with process information", async () => {
        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

        const mockCommands = {
            command1: { description: "test" },
            command2: { description: "another test" },
            "grouped:anotherkey": { description: "I should be grouped" },
            "grouped:again": { description: "I'm also grouped" },
        };

        cli.app.bind(Container.Identifiers.Commands).toConstantValue(mockCommands);

        await cli.execute(Command);

        expect(message).toIncludeMultiple(
            Object.keys(mockCommands).concat(
                Object.values(mockCommands)
                    .map((value) => value.description)
                    .concat(["grouped", "default", "Usage", "Flags", "Available Commands"]),
            ),
        );
    });
});
