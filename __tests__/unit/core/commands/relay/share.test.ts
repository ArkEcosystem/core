import { ShareCommand } from "@packages/core/src/commands/relay/share";
import ngrok from "ngrok";

describe("ShareCommand", () => {
    it("should throw if the process does not exist", async () => {
        const spyConnect = jest.spyOn(ngrok, "connect").mockImplementation(undefined);

        await ShareCommand.run([]);

        expect(spyConnect).toHaveBeenCalledWith({
            addr: 4003,
            proto: "http",
            region: "eu",
        });
    });
});
