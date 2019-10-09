import "jest-extended";

import { parseGitUrl } from "@arkecosystem/utils";
import { dirSync, setGracefulCleanup } from "tmp";
import fs from "fs-extra";
import execa from "../../../../../../__mocks__/execa";

import { Git } from "@packages/core/src/services/plugins/sources";

let dataPath: string;
let source: Git;
beforeEach(() => {
    dataPath = dirSync().name;

    source = new Git({ data: dataPath });
});

afterAll(() => setGracefulCleanup());

describe("Git", () => {
    describe("#exists", () => {
        it("should return true if the file exists", async () => {
            await expect(source.exists("git@github.com:ArkEcosystem/utils.git")).resolves.toBeTrue();
        });

        it("should return false if the file does not exists", async () => {
            await expect(source.exists("does not exist")).resolves.toBeFalse();
        });
    });

    describe("#install", () => {
        it("should successfully install the plugin", async () => {
            // Arrange
            const removeSync = jest.spyOn(fs, "removeSync").mockImplementation();
            const clone = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            const repository: string = "git@github.com:ArkEcosystem/utils.git";
            await source.install(repository);

            // Assert
            const targetPath: string = `${dataPath}/plugins/${parseGitUrl(repository).repo}`;
            expect(removeSync).toHaveBeenCalledWith(targetPath);
            expect(clone).toHaveBeenCalledWith(`git clone ${repository} ${targetPath}`);

            // Reset
            removeSync.mockReset();
            clone.mockReset();
        });
    });

    describe("#update", () => {
        it("should successfully update the plugin", async () => {
            // Arrange
            const pull = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            const repository: string = "git@github.com:ArkEcosystem/utils.git";

            await source.update(repository);

            // Assert
            expect(pull).toHaveBeenCalledWith(
                `cd ${dataPath}/plugins/${parseGitUrl(repository).repo} && git reset --hard && git pull`,
            );

            // Reset
            pull.mockReset();
        });
    });
});
