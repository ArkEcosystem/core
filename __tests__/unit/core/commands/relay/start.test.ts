import { StartCommand } from "@packages/core/src/commands/relay/start";
import { processManager } from "@packages/core/src/common/process-manager";
import { resolve } from "path";
import os from "os";

describe("StartCommand", () => {
    it("should throw if the process does not exist", async () => {
        jest.spyOn(os, "freemem").mockReturnValue(99999999999);
        jest.spyOn(os, "totalmem").mockReturnValue(99999999999);

        const spyStart = jest.spyOn(processManager, "start").mockImplementation(undefined);

        await StartCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyStart).toHaveBeenCalledWith(
            {
                args: "relay:run --token=ark --network=testnet --suffix=relay --env=production",
                env: {
                    CORE_ENV: "production",
                    NODE_ENV: "production",
                },
                name: "ark-relay",
                node_args: undefined,
                script: resolve(__dirname, "../../../../../packages/core/src/commands/relay/start.ts"),
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-relay" },
        );
    });
});
