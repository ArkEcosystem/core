import "jest-extended";

import { getLatestVersion, getRegistryChannel, installFromChannel } from "@packages/core/src/common/update";
import nock from "nock";

import execa from "../../../../__mocks__/execa";
import { versionLatest, versionNext } from "./__fixtures__/latest-version";

beforeEach(() => nock.cleanAll());

beforeAll(() => nock.disableNetConnect());

afterAll(() => nock.enableNetConnect());

describe("getLatestVersion", () => {
    it("should fail to get the npm registry channel", async () => {
        await expect(getLatestVersion("@arkecosystem/core", "latest")).resolves.toBeUndefined();
    });

    it("should get the npm registry channel (latest)", async () => {
        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionLatest);

        await expect(getLatestVersion("@arkecosystem/core", "latest")).resolves.toBe("2.5.24");
    });

    it("should get the npm registry channel (next)", async () => {
        nock(/.*/).get("/@arkecosystem%2Fcore").reply(200, versionNext);

        await expect(getLatestVersion("@arkecosystem/core", "next")).resolves.toBe("2.5.0-next.10");
    });
});

describe("getRegistryChannel", () => {
    it("should get the npm registry channel", async () => {
        expect(getRegistryChannel("3.0.0")).toBe("latest");
        expect(getRegistryChannel("3.0.0-next.0")).toBe("next");
    });
});

describe("installFromChannel", () => {
    it("should be ok if no [stderr] output is present", () => {
        const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: undefined,
        });

        installFromChannel("@arkecosystem/core", "latest");

        expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest");
    });

    it("should be not ok if [stderr] output is present", () => {
        const spySync: jest.SpyInstance = jest.spyOn(execa, "sync").mockReturnValue({
            stdout: "stdout",
            stderr: "stderr",
        });

        expect(() => installFromChannel("@arkecosystem/core", "latest")).toThrow("stderr");

        expect(spySync).toHaveBeenCalledWith("yarn global add @arkecosystem/core@latest");
    });
});
