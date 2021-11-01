import "jest-extended";

import { File, Errors } from "@packages/core-cli/src/services/source-providers";
import fs from "fs-extra";
import { dirSync, fileSync, setGracefulCleanup } from "tmp";
import { join } from "path";
import execa from "execa";

let dataPath: string;
let tempPath: string;
let source: File;
beforeEach(() => {
    dataPath = dirSync().name;
    tempPath = dirSync().name;

    source = new File({ data: dataPath, temp: tempPath });
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(() => setGracefulCleanup());

describe("File", () => {
    describe("#exists", () => {
        it("should return true if the file exists", async () => {
            await expect(source.exists(fileSync().name)).resolves.toBeTrue();
        });

        it("should return false if the file does not exists", async () => {
            await expect(source.exists("does not exist")).resolves.toBeFalse();
        });
    });

    describe("#install", () => {
        it("should successfully install the plugin", async () => {
            // Arrange
            const fileName: string = join(__dirname, "utils-0.9.1.tgz");

            const removeSync = jest.spyOn(fs, "removeSync").mockImplementation();
            const spyOnExeca = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            await source.install(fileName);

            // Assert
            const packageName: string = "@arkecosystem/utils";
            expect(removeSync).toHaveBeenCalledWith(join(dataPath, packageName));
            expect(removeSync).toHaveBeenLastCalledWith(join(tempPath, "package"));
            expect(spyOnExeca).toHaveBeenCalledWith(`yarn`, ["install", "--production"], {
                cwd: join(dataPath, packageName),
            });
        });

        it("should throw error if .tgz doesn't contains package folder", async () => {
            // Arrange
            const fileName: string = join(__dirname, "invalid-utils-0.9.1.tgz");

            // Act
            await expect(source.install(fileName)).rejects.toThrowError(Errors.MissingPackageFolder);
        });

        it("should throw error if .tgz doesn't contains package.json", async () => {
            // Arrange
            const fileName: string = join(__dirname, "missing-utils-0.9.1.tgz");

            // Act
            await expect(source.install(fileName)).rejects.toThrowError(Errors.InvalidPackageJson);
        });
    });

    describe("#update", () => {
        it("should successfully update the plugin", async () => {
            // Arrange
            const fileName: string = join(__dirname, "utils-0.9.1.tgz");

            const removeSync = jest.spyOn(fs, "removeSync").mockImplementation();
            const spyOnExeca = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            await source.update(fileName);

            // Assert
            const packageName: string = "@arkecosystem/utils";
            expect(removeSync).toHaveBeenCalledWith(join(dataPath, packageName));
            expect(removeSync).toHaveBeenLastCalledWith(join(tempPath, "package"));
            expect(spyOnExeca).toHaveBeenCalledWith(`yarn`, ["install", "--production"], {
                cwd: join(dataPath, packageName),
            });
        });
    });
});
