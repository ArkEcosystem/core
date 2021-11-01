import "jest-extended";

import { Git } from "@packages/core-cli/src/services/source-providers";
import fs from "fs-extra";
import { dirSync, setGracefulCleanup } from "tmp";
import { join } from "path";

import execa from "../../../../../__mocks__/execa";

let dataPath: string;
let tempPath: string;
let source: Git;
beforeEach(() => {
    dataPath = dirSync().name;
    tempPath = dirSync().name;

    source = new Git({ data: dataPath, temp: tempPath });
});

afterEach(() => {
    jest.clearAllMocks();
})

afterAll(() =>  setGracefulCleanup());

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
            const spyOnExeca = jest.spyOn(execa, "sync").mockImplementation(() => {
                fs.ensureDirSync(join(tempPath, "package"));
                fs.writeJSONSync(join(tempPath, "package", "package.json"), { name: "@arkecosystem/utils" });
            });

            // Act
            const repository: string = "git@github.com:ArkEcosystem/utils.git";
            await source.install(repository);

            // Assert
            const packageName: string = "@arkecosystem/utils";
            const targetPath: string = `${dataPath}/${packageName}`;
            expect(removeSync).toHaveBeenCalledWith(targetPath);
            expect(removeSync).toHaveBeenCalledWith(join(tempPath, "package"));
            expect(spyOnExeca).toHaveBeenCalledWith(`git`, ["clone", repository, join(tempPath, "package")]);
            expect(spyOnExeca).toHaveBeenCalledWith(`yarn`, ["install", "--production"], {
                cwd: join(dataPath, packageName),
            });
        });
    });

    describe("#update", () => {
        it("should successfully update the plugin", async () => {
            // Arrange
            const spyOnExeca = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            const packageName: string = "@arkecosystem/utils";
            await source.update(packageName);

            // Assert
            expect(spyOnExeca).toHaveBeenCalledWith(`git`, ["reset", "--hard"], { cwd: join(dataPath, packageName) });
            expect(spyOnExeca).toHaveBeenCalledWith(`git`, ["pull"], { cwd: join(dataPath, packageName) });
            expect(spyOnExeca).toHaveBeenCalledWith(`yarn`, ["install", "--production"], { cwd: join(dataPath, packageName) });
        });
    });
});
