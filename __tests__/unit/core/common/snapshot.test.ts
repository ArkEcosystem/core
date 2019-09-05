import prompts from "prompts";

import { chooseSnapshot } from "@packages/core/src/common/snapshot";
import fs from "fs-extra";

/**
 * Please note that this test scenario makes heavy use of mocks ONLY for the filesystem.
 *
 * Hitting the filesystem is expensive and slow while our only concern is if methods are
 * called. The functionality of the filesystem actions is covered by the fs-extra tests.
 *
 * Another hidden cost is that tests that rely on real filesystems can be slow and fragile
 * across platforms because of minor difference.
 */
describe("chooseSnapshot", () => {
    it("should throw if the snapshots directory cannot be found", async () => {
        await expect(chooseSnapshot("not-found", "message")).rejects.toThrow(
            "The snapshots directory could not be found",
        );
    });

    it("should throw if no snapshots can be found", async () => {
        const spyExistsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const spyReaddirSync = jest.spyOn(fs, "readdirSync").mockReturnValueOnce([]);

        await expect(chooseSnapshot("dataPath", "message")).rejects.toThrow("Failed to find any snapshots.");

        expect(spyExistsSync).toHaveBeenCalled();
        expect(spyReaddirSync).toHaveBeenCalled();
    });

    it("should choose the first snapshot if only a single snapshot is found", async () => {
        const spyExistsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const spyReaddirSync = jest
            .spyOn(fs, "readdirSync")
            // @ts-ignore
            .mockReturnValueOnce(["1"]);
        const spyLstatSync = jest
            .spyOn(fs, "lstatSync")
            // @ts-ignore
            .mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) });

        expect(await chooseSnapshot("stub", "message")).toBe("1");

        expect(spyExistsSync).toHaveBeenCalled();
        expect(spyReaddirSync).toHaveBeenCalled();
        expect(spyLstatSync).toHaveBeenCalled();
    });

    it("should choose the selected snapshot if multiple snapshots are found", async () => {
        const spyExistsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const spyReaddirSync = jest
            .spyOn(fs, "readdirSync")
            // @ts-ignore
            .mockReturnValueOnce(["1", "2"]);
        const spyLstatSync = jest
            .spyOn(fs, "lstatSync")
            // @ts-ignore
            .mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) });

        prompts.inject(["2", true]);

        expect(await chooseSnapshot("stub", "message")).toBe("2");

        expect(spyExistsSync).toHaveBeenCalled();
        expect(spyReaddirSync).toHaveBeenCalled();
        expect(spyLstatSync).toHaveBeenCalled();
    });

    it("should throw if the snapshot selection is not confirmed", async () => {
        const spyExistsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const spyReaddirSync = jest
            .spyOn(fs, "readdirSync")
            // @ts-ignore
            .mockReturnValueOnce(["1", "2"]);
        const spyLstatSync = jest
            .spyOn(fs, "lstatSync")
            // @ts-ignore
            .mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) });

        prompts.inject(["2", false]);

        await expect(chooseSnapshot("stub", "message")).rejects.toThrow(
            "You'll need to confirm the snapshot to continue.",
        );

        expect(spyExistsSync).toHaveBeenCalled();
        expect(spyReaddirSync).toHaveBeenCalled();
        expect(spyLstatSync).toHaveBeenCalled();
    });

    it("should throw if no snapshot is selected", async () => {
        const spyExistsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
        const spyReaddirSync = jest
            .spyOn(fs, "readdirSync")
            // @ts-ignore
            .mockReturnValueOnce(["1", "2"]);
        const spyLstatSync = jest
            .spyOn(fs, "lstatSync")
            // @ts-ignore
            .mockReturnValue({ isDirectory: jest.fn().mockReturnValue(true) });

        prompts.inject([undefined, true]);

        await expect(chooseSnapshot("stub", "message")).rejects.toThrow("Please select a snapshot and try again.");

        expect(spyExistsSync).toHaveBeenCalled();
        expect(spyReaddirSync).toHaveBeenCalled();
        expect(spyLstatSync).toHaveBeenCalled();
    });
});
