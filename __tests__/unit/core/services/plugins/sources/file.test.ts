import "jest-extended";

import { dirSync, fileSync, setGracefulCleanup } from "tmp";
import fs from "fs-extra";
import tar from "tar";

import { File } from "@packages/core/src/services/plugins/sources";

let dataPath: string;
let source: File;
beforeEach(() => {
    dataPath = dirSync().name;

    source = new File({ data: dataPath });
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
            const fileName: string = `${dirSync().name}/utils.tgz`;

            fs.ensureFileSync(fileName);

            await tar.create(
                {
                    gzip: true,
                    file: fileName,
                },
                [fileSync().name, fileSync().name, fileSync().name],
            );

            const removeSync = jest.spyOn(fs, "removeSync").mockImplementation();

            // Act
            await source.install(fileName);

            // Assert
            expect(removeSync).toHaveBeenCalledWith(`${dataPath}/plugins/utils`);
            expect(fs.existsSync(`${dataPath}/plugins`)).toBeTrue();
            expect(removeSync).toHaveBeenLastCalledWith(fileName);

            // Reset
            removeSync.mockReset();
        });
    });
});
