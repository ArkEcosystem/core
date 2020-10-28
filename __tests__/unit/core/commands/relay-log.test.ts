import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/relay-log";
import { fileSync, setGracefulCleanup } from "tmp";

jest.mock("nodejs-tail");

let cli;
let processManager;
beforeEach(() => {
    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);
});

afterEach(() => jest.restoreAllMocks());

afterAll(() => setGracefulCleanup());

describe("LogCommand", () => {
    it("should throw if the process does not exist", async () => {
        await expect(cli.execute(Command)).rejects.toThrow('The "ark-relay" process does not exist.');
    });

    it("should log to pm_out_log_path", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.AbortMissingProcess), "execute").mockImplementation();
        jest.spyOn(processManager, "describe").mockReturnValue({
            pid: 1,
            name: "ark-relay",
            pm2_env: {
                version: "1.0.0",
                status: "online",
                pm_uptime: 1387045673686,
                pm_err_log_path: fileSync().name,
                pm_out_log_path: fileSync().name,
            },
            monit: { cpu: 2, memory: 2048 },
        });

        const spyLog = jest.spyOn(console, "log");

        await cli.execute(Command);

        expect(spyLog).toHaveBeenCalledWith(
            "Tailing last 15 lines for [ark-relay] process (change the value with --lines option)",
        );
    });

    it("should log to pm_err_log_path", async () => {
        jest.spyOn(cli.app.get(Container.Identifiers.AbortMissingProcess), "execute").mockImplementation();
        jest.spyOn(processManager, "describe").mockReturnValue({
            pid: 1,
            name: "ark-relay",
            pm2_env: {
                version: "1.0.0",
                status: "online",
                pm_uptime: 1387045673686,
                pm_err_log_path: fileSync().name,
                pm_out_log_path: fileSync().name,
            },
            monit: { cpu: 2, memory: 2048 },
        });

        const spyLog = jest.spyOn(console, "log");

        await cli.withFlags({ error: true }).execute(Command);

        expect(spyLog).toHaveBeenCalledWith(
            "Tailing last 15 lines for [ark-relay] process (change the value with --lines option)",
        );
    });
});
