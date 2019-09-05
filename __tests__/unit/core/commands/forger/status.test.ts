import "jest-extended";

import { CLIError } from "@oclif/errors";
import { StatusCommand } from "@packages/core/src/commands/forger/status";
import { processManager } from "@packages/core/src/common/process-manager";

describe("StatusCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(StatusCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-forger" process does not exist.'),
        );
    });

    it("should render a table with the process information", async () => {
        jest.spyOn(processManager, "missing").mockReturnValue(false);
        jest.spyOn(processManager, "describe").mockReturnValue({
            pid: 1,
            name: "ark-forger",
            pm2_env: {
                version: "1.0.0",
                status: "online",
                pm_uptime: 1387045673686,
            },
            monit: { cpu: 2, memory: 2048 },
        });

        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce(m => (message = m));

        await StatusCommand.run(["--token=ark", "--network=testnet"]);

        expect(message).toIncludeMultiple(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"]);
        expect(message).toIncludeMultiple([
            "1",
            "ark-forger",
            "1.0.0",
            "online",
            // "5y 267d 19h 31m 28.1s",
            "2%",
            "2.05 kB",
        ]);
    });
});
