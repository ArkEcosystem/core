import { ShareCommand } from "@packages/core/src/commands/relay/share";
import ngrok from "ngrok";

describe("ShareCommand", () => {
    // todo: Cannot call write after a stream was destroyedError [ERR_STREAM_DESTROYED]: Cannot call write after a stream was destroyed
    it.skip("should throw if the process does not exist", async () => {
        const spyConnect = jest.spyOn(ngrok, "connect").mockImplementation(undefined);

        await ShareCommand.run([]);

        expect(spyConnect).toHaveBeenCalledWith({
            addr: 4003,
            proto: "http",
            region: "eu",
        });
    });
});
