import "jest-extended";

import nock from "nock";
import { UpdateCommand } from "@packages/core/src/commands/update";
import { processManager } from "@packages/core/src/common/process-manager";
import prompts from "prompts";
import execa from "../../../../__mocks__/execa";

import { versionNext } from "../common/__fixtures__/latest-version";

beforeEach(() => nock.cleanAll());

beforeAll(() => nock.disableNetConnect());

afterAll(() => nock.enableNetConnect());

describe("UpdateCommand", () => {
    it("should throw if the latest version is already installed", async () => {
        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, versionNext);

        await expect(UpdateCommand.run(["--force"])).rejects.toThrow(
            "You already have the latest version (3.0.0-next.0)",
        );
    });

    it("should throw if the update is not confirmed", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([false]);

        await expect(UpdateCommand.run(["--token=ark"])).rejects.toThrow(
            "You'll need to confirm the update to continue.",
        );

        expect(sync).not.toHaveBeenCalled();

        sync.mockReset();
    });

    it("should update without a prompt if the [--force] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        await UpdateCommand.run(["--token=ark", "--force"]);

        expect(sync).toHaveBeenCalledTimes(4); // install > restart core > restart relay > restart forger

        sync.mockReset();
    });

    it("should update with a prompt if the [--force] flag is not present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        prompts.inject([true]);

        await UpdateCommand.run(["--token=ark"]);

        expect(sync).toHaveBeenCalled();

        sync.mockReset();
    });

    it("should update and restart all processes if the [--restart] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await UpdateCommand.run(["--token=ark", "--force", "--restart"]);

        expect(sync).toHaveBeenCalledTimes(4); // install > restart core > restart relay > restart forger

        sync.mockReset();
        restart.mockClear();
    });

    it("should update and restart the core process if the [--restartCore] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await UpdateCommand.run(["--token=ark", "--force", "--restartCore"]);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-core");

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });

    it("should update and restart the core process if the [--restartRelay] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await UpdateCommand.run(["--token=ark", "--force", "--restartRelay"]);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-relay");

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });

    it("should update and restart the core process if the [--restartForger] flag is present", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        await UpdateCommand.run(["--token=ark", "--force", "--restartForger"]);

        expect(sync).toHaveBeenCalledTimes(1);
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(1);
        expect(restart).toHaveBeenCalledWith("ark-forger");

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });

    it("should update with a prompt and restart processes after confirmation", async () => {
        const response = { ...versionNext };
        response["dist-tags"].next = "4.0.0-next.0";
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"] };
        response.versions["4.0.0-next.0"] = { ...response.versions["2.5.0-next.10"], ...{ version: "4.0.0-next.0" } };

        nock("https://registry.npmjs.org")
            .get("/@arkecosystem%2Fcore")
            .reply(200, response);

        const sync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });
        const isOnline = jest.spyOn(processManager, "isOnline").mockReturnValue(true);
        const restart = jest.spyOn(processManager, "restart").mockImplementation(undefined);

        prompts.inject([true]); // update
        prompts.inject([true]); // restart relay
        prompts.inject([true]); // restart forger
        prompts.inject([true]); // restart forger

        await UpdateCommand.run(["--token=ark"]);

        expect(sync).toHaveBeenCalled();
        expect(isOnline).toHaveBeenCalled();
        expect(restart).toHaveBeenCalledTimes(3);

        sync.mockReset();
        isOnline.mockClear();
        restart.mockClear();
    });
});
