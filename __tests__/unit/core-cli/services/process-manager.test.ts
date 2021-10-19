import "jest-extended";

import { Contracts } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { ProcessManager } from "@packages/core-cli/src/services";
import execa from "execa";

jest.mock("execa");

let cli;
let processManager;

beforeAll(() => {
    cli = new Console();

    processManager = cli.app.resolve(ProcessManager);
});

afterEach(() => jest.resetAllMocks());

describe("ProcessManager", () => {
    describe(".list()", () => {
        it("should return an empty array if stdout is empty", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const processes: Contracts.ProcessDescription[] | undefined = processManager.list();

            // Assert...
            expect(processes).toBeArray();
            expect(processes).toBeEmpty();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return an empty array if stdout is empty after trimming", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "\n",
                stderr: undefined,
                failed: false,
            });

            // Act...
            const processes: Contracts.ProcessDescription[] | undefined = processManager.list();

            // Assert...
            expect(processes).toBeArray();
            expect(processes).toBeEmpty();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return an empty array if stdout is invalid JSON", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "{",
                stderr: undefined,
                failed: false,
            });

            // Act...
            const processes: Contracts.ProcessDescription[] | undefined = processManager.list();

            // Assert...
            expect(processes).toBeArray();
            expect(processes).toBeEmpty();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return an empty array if an exception is thrown", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockImplementation(() => {
                throw new Error("Whoops");
            });

            // Act...
            const processes: Contracts.ProcessDescription[] | undefined = processManager.list();

            // Assert...
            expect(processes).toBeArray();
            expect(processes).toBeEmpty();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return an array if stdout is valid JSON", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "key": "value" }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const processes: Contracts.ProcessDescription[] | undefined = processManager.list();

            // Assert...
            expect(processes).toEqual([{ key: "value" }]);
            expect(processes).not.toBeEmpty();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#describe", () => {
        it("should return an object if the process exists", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "unknown" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const process: Contracts.ProcessDescription | undefined = processManager.describe("stub");

            // Assert...
            expect(process).toBeObject();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return undefined if the process does not exist", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub-other", "pm2_env": { "status": "unknown" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const process: Contracts.ProcessDescription | undefined = processManager.describe("stub");

            // Assert...
            expect(process).toBeUndefined();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return undefined if stdout is an empty array", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "[]",
                stderr: undefined,
                failed: false,
            });

            // Act...
            const process: Contracts.ProcessDescription | undefined = processManager.describe("stub");

            // Assert...
            expect(process).toBeUndefined();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("return undefined if an exception is thrown", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockImplementation(() => {
                throw new Error("Whoops");
            });

            // Act...
            const process: Contracts.ProcessDescription | undefined = processManager.describe("stub");

            // Assert...
            expect(process).toBeUndefined();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#start", () => {
        it("should be OK if failed is false", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.start(
                {
                    script: "stub.js",
                },
                { name: "stub" },
            );

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 start stub.js --name='stub'", { shell: true });
        });

        it("should respect the given node_args", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.start(
                {
                    script: "stub.js",
                    node_args: { max_old_space_size: 500 },
                },
                { name: "stub" },
            );

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith(
                "pm2 start stub.js --node-args=\"--max_old_space_size=500\" --name='stub'",
                { shell: true },
            );
        });

        it("should respect the given args", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.start(
                {
                    script: "stub.js",
                    args: "core:run --daemon",
                },
                { name: "stub" },
            );

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 start stub.js --name='stub' -- core:run --daemon", { shell: true });
        });

        it("should ignore the flags if they are undefined", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.start(
                {
                    script: "stub.js",
                },
                undefined,
            );

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 start stub.js", { shell: true });
        });
    });

    describe("#stop", () => {
        it("should be OK if failed is false", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.stop("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 stop stub", { shell: true });
        });

        it("should respect the given flags", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.stop("stub", { key: "value" });

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 stop stub --key='value'", { shell: true });
        });
    });

    describe("#restart", () => {
        it("should be OK if failed is false", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.restart("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 restart stub --update-env", { shell: true });
        });

        it("should respect the given flags", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.restart("stub", { key: "value" });

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 restart stub --key='value'", { shell: true });
        });

        it("should ignore the flags if they are empty", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.restart("stub", {});

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 restart stub", { shell: true });
        });
    });

    describe("#reload", () => {
        it(".reload()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.reload("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 reload stub", { shell: true });
        });
    });

    describe("#reset", () => {
        it(".reset()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.reset("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 reset stub", { shell: true });
        });
    });

    describe("#delete", () => {
        it(".delete()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.delete("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 delete stub", { shell: true });
        });
    });

    describe("#flush", () => {
        it(".flush()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.flush("stub");

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 flush", { shell: true });
        });
    });

    describe("#reloadLogs", () => {
        it(".reloadLogs()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.reloadLogs();

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 reloadLogs", { shell: true });
        });
    });

    describe("#ping", () => {
        it(".ping()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.ping();

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 ping", { shell: true });
        });
    });

    describe("#update", () => {
        it(".update()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = processManager.update();

            // Assert...
            expect(failed).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 update", { shell: true });
        });
    });

    describe("#trigger", () => {
        it(".trigger()", async () => {
            // Arrange...
            execa.mockResolvedValue({
                stdout: null,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const { failed } = await processManager.trigger("ark-core", "module.name", "params");

            // Assert...
            expect(failed).toBeFalse();
            expect(execa).toHaveBeenCalledWith("pm2 trigger ark-core module.name params", { shell: true });
        });
    });

    describe("#status", () => {
        it("should return the status if the process exists", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "online" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.status("stub");

            // Assert...
            expect(status).toBe("online");
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("return undefined if an exception is thrown", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockImplementation(() => {
                throw new Error("Whoops");
            });

            // Act...
            const status = processManager.status("stub");

            // Assert...
            expect(status).toBeUndefined();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#status", () => {
        it(".status()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub-other", "pm2_env": { "status": "online" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.status("stub");

            // Assert...
            expect(status).toBeUndefined();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isOnline", () => {
        it(".isOnline()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "online" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isOnline("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isStopped", () => {
        it(".isStopped()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "stopped" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isStopped("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isStopping", () => {
        it(".isStopping()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "stopping" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isStopping("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isWaiting", () => {
        it(".isWaiting()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "waiting restart" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isWaiting("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isLaunching", () => {
        it(".isLaunching()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "launching" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isLaunching("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isErrored", () => {
        it(".isErrored()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "errored" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isErrored("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isOneLaunch", () => {
        it(".isOneLaunch()", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "one-launch-status" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isOneLaunch("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#isUnknown", () => {
        it("should return true if the process has a status of [unknown]", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "unknown" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isUnknown("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("should return false if the process has a status other than [unknown]", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: '[{ "id": "stub", "pm2_env": { "status": "online" } }]',
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.isUnknown("stub");

            // Assert...
            expect(status).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });

        it("return true if an exception is thrown", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockImplementation(() => {
                throw new Error("Whoops");
            });

            // Act...
            const status = processManager.isUnknown("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 jlist", { shell: true });
        });
    });

    describe("#has", () => {
        it("should return true if the process ID is a number", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: 1,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.has("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 id stub | awk '{ print $2 }'", { shell: true });
        });

        it("return false if the process ID is not a number", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "",
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.has("stub");

            // Assert...
            expect(status).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 id stub | awk '{ print $2 }'", { shell: true });
        });

        it("return false if an exception is thrown", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockImplementation(() => {
                throw new Error("Whoops");
            });

            // Act...
            const status = processManager.has("stub");

            // Assert...
            expect(status).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 id stub | awk '{ print $2 }'", { shell: true });
        });
    });

    describe("#missing", () => {
        it("return true if the process ID is not a number", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: "",
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.missing("stub");

            // Assert...
            expect(status).toBeTrue();
            expect(spySync).toHaveBeenCalledWith("pm2 id stub | awk '{ print $2 }'", { shell: true });
        });

        it("return false if the process ID is a number", () => {
            // Arrange...
            const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
                stdout: 1,
                stderr: undefined,
                failed: false,
            });

            // Act...
            const status = processManager.missing("stub");

            // Assert...
            expect(status).toBeFalse();
            expect(spySync).toHaveBeenCalledWith("pm2 id stub | awk '{ print $2 }'", { shell: true });
        });
    });
});
