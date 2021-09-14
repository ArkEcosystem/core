import "jest-extended";

import { Container } from "@arkecosystem/core-cli";
import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/update";
import nock from "nock";
import prompts from "prompts";

import execa from "../../../../__mocks__/execa";
import { versionNext } from "../internal/__fixtures__/latest-version";

let cli;
let processManager;

beforeEach(() => {
    nock.cleanAll();

    cli = new Console();
    processManager = cli.app.get(Container.Identifiers.ProcessManager);
});

afterEach(() => jest.resetAllMocks());

beforeAll(() => nock.disableNetConnect());

afterAll(() => nock.enableNetConnect());

describe("UpdateCommand", () => {
    it("should throw if the latest version is already installed", async () => {
        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionNext);

        const spySuccess = jest.spyOn(cli.app.get(Container.Identifiers.Success), "render");

        await cli.withFlags({ force: true }).execute(Command);

        expect(spySuccess).toHaveBeenCalledWith("You already have the latest version (3.0.0-next.0)");
    });

    it("should throw if the update is not confirmed", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([false]);

        await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the update to continue.");

        expect(sync).not.toHaveBeenCalled();
    });

    it("should update without a prompt if the [--force] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });

        await cli.withFlags({ force: true, updateProcessManager: true }).execute(Command);

        // yarn info peerDependencies
        // yarn global add
        // pm2 update
        expect(sync).toHaveBeenCalledTimes(3);
    });

    it("should update and reset without a prompt if the [--force --reset] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });

        await cli.withFlags({ force: true, reset: true, updateProcessManager: true }).execute(Command);

        // yarn info peerDependencies
        // yarn global add
        // pm2 update
        // restart core
        // restart relay
        // restart forger
        expect(sync).toHaveBeenCalledTimes(3);
    });

    it("should update with a prompt if the [--force] flag is not present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });

        prompts.inject([true]);

        await cli.execute(Command);

        expect(sync).toHaveBeenCalled();

        sync.mockReset();
    });

    it("should update and restart all processes if the [--restart] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });
        jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await cli.withFlags({ force: true, restart: true, updateProcessManager: true }).execute(Command);

        // yarn info peerDependencies
        // yarn global add
        // pm2 update
        // restart core
        // restart relay
        // restart forger
        expect(sync).toHaveBeenCalledTimes(6);
    });

    it("should update and restart the core process if the [--restartCore] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await cli.withFlags({ force: true, restartCore: true, updateProcessManager: true }).execute(Command);

        expect(sync).toHaveBeenCalledTimes(3);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-core");
    });

    it("should update and restart the core process if the [--restartRelay] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await cli.withFlags({ force: true, restartRelay: true, updateProcessManager: true }).execute(Command);

        expect(sync).toHaveBeenCalledTimes(3);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-relay");
    });

    it("should update and restart the core process if the [--restartForger] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await cli.withFlags({ force: true, restartForger: true, updateProcessManager: true }).execute(Command);

        expect(sync).toHaveBeenCalledTimes(3);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-forger");
    });

    it("should update with a prompt and restart processes after confirmation", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: '"null"',
            stderr: undefined,
            exitCode: 0,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([true]); // update
        prompts.inject([true]); // restart core
        prompts.inject([true]); // restart forger
        prompts.inject([true]); // restart relay

        await cli.execute(Command);

        expect(sync).toHaveBeenCalledTimes(2);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(3);
    });
});
