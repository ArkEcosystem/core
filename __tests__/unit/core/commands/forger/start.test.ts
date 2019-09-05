import { StartCommand } from "@packages/core/src/commands/forger/start";
import { processManager } from "@packages/core/src/common/process-manager";
import { resolve } from "path";
import { dirSync, setGracefulCleanup } from "tmp";
import { writeJSONSync } from "fs-extra";
import os from "os";

afterAll(() => setGracefulCleanup());

describe("StartCommand", () => {
    it("should throw if the process does not exist", async () => {
        process.env.CORE_PATH_CONFIG = dirSync().name;

        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/delegates.json`, { secrets: ["bip39"] });

        jest.spyOn(os, "freemem").mockReturnValue(99999999999);
        jest.spyOn(os, "totalmem").mockReturnValue(99999999999);

        const spyStart = jest.spyOn(processManager, "start").mockImplementation(undefined);

        await StartCommand.run(["--token=ark", "--network=testnet"]);

        expect(spyStart).toHaveBeenCalledWith(
            {
                args: "forger:run --token=ark --network=testnet --suffix=forger --env=production",
                env: {
                    CORE_ENV: "production",
                    NODE_ENV: "production",
                },
                name: "ark-forger",
                node_args: undefined,
                script: resolve(__dirname, "../../../../../packages/core/src/commands/forger/start.ts"),
            },
            { "kill-timeout": 30000, "max-restarts": 5, name: "ark-forger" },
        );
    });
});
