import { fileSync, setGracefulCleanup } from "tmp";
import { CLIError } from "@oclif/errors";
import { LogCommand } from "@packages/core/src/commands/relay/log";
import { processManager } from "@packages/core/src/common/process-manager";

jest.mock("nodejs-tail");

let messages;

beforeEach(() => {
    messages = [];

    jest.spyOn(process.stdout, "write").mockImplementation((value: string) => messages.push(value.trim()));
});

afterEach(() => jest.restoreAllMocks());

afterAll(() => setGracefulCleanup());

describe("LogCommand", () => {
    it("should throw if the process does not exist", async () => {
        const missing = jest.spyOn(processManager, "missing").mockReturnValue(true);

        await expect(LogCommand.run(["--token=ark", "--network=testnet"])).rejects.toThrowError(
            new CLIError('The "ark-relay" process does not exist.'),
        );

        missing.mockReset();
    });

    it("should log to pm_out_log_path", async () => {
        jest.spyOn(processManager, "missing").mockReturnValue(false);
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

        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);

        await LogCommand.run(["--token=ark", "--network=testnet"]);

        expect(messages).toContain(
            "Tailing last 15 lines for [ark-relay] process (change the value with --lines option)",
        );

        missing.mockReset();
    });

    it("should log to pm_err_log_path", async () => {
        jest.spyOn(processManager, "missing").mockReturnValue(false);
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

        const missing = jest.spyOn(processManager, "missing").mockReturnValue(false);

        await LogCommand.run(["--token=ark", "--network=testnet", "--error"]);

        expect(messages).toContain(
            "Tailing last 15 lines for [ark-relay] process (change the value with --lines option)",
        );

        missing.mockReset();
    });
});
