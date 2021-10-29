import "jest-extended";

import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/core-status";

let cli;
let processManager;
beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);
});

describe("StatusCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(cli.execute(Command)).rejects.toThrow('The "ark-core" process does not exist.');
    });

    it("should render a table with the process information", async () => {
        jest.spyOn(processManager, "missing").mockReturnValue(false);
        jest.spyOn(processManager, "describe").mockReturnValue({
            pid: 1,
            name: "ark-core",
            pm2_env: {
                version: "1.0.0",
                status: "online",
                pm_uptime: 1387045673686,
            },
            monit: { cpu: 2, memory: 2048 },
        });

        let message: string;
        jest.spyOn(console, "log").mockImplementationOnce((m) => (message = m));

        await cli.execute(Command);

        expect(message).toIncludeMultiple(["ID", "Name", "Version", "Status", "Uptime", "CPU", "RAM"]);
        expect(message).toIncludeMultiple([
            "1",
            "ark-core",
            "1.0.0",
            "online",
            // "5y 267d 19h 31m 28.1s",
            "2%",
            "2.05 kB",
        ]);
    });
});
