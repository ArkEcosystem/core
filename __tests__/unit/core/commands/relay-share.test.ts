import { Console } from "@arkecosystem/core-test-framework";
import ngrok from "ngrok";

import { Command } from "@packages/core/src/commands/relay-share";

let cli;
beforeEach(() => (cli = new Console()));

describe("ShareCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyConnect = jest.spyOn(ngrok, "connect").mockImplementation(undefined);

        await cli.execute(Command);

        expect(spyConnect).toHaveBeenCalledWith({
            addr: 4003,
            proto: "http",
            region: "eu",
        });
    });
});
