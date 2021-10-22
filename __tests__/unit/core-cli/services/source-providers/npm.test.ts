import "jest-extended";

import { NPM } from "@packages/core-cli/src/services/source-providers";
import execa from "execa";
import fs from "fs-extra";
import nock from "nock";
import { join, resolve } from "path";
import { dirSync, setGracefulCleanup } from "tmp";

let dataPath: string;
let tempPath: string;
let source: NPM;

beforeEach(() => {
    dataPath = dirSync().name;
    tempPath = dirSync().name;

    source = new NPM({ data: dataPath, temp: tempPath });

    nock.cleanAll();
});

beforeEach(() => {
    setGracefulCleanup();

    nock.disableNetConnect();
});

afterEach(() => nock.enableNetConnect());

describe("NPM", () => {
    describe("#exists", () => {
        it("should return true if the file exists", async () => {
            nock(/.*/)
                .get("/@arkecosystem/utils")
                .reply(200, {
                    name: "@arkecosystem/utils",
                    "dist-tags": {
                        latest: "0.9.1",
                    },
                    versions: {
                        "0.9.1": {
                            name: "@arkecosystem/utils",
                            version: "0.9.1",
                            dist: {
                                tarball: "https://registry.npmjs.org/@arkecosystem/utils/-/utils-0.9.1.tgz",
                            },
                        },
                    },
                });

            await expect(source.exists("@arkecosystem/utils")).resolves.toBeTrue();
        });

        it("should return true if the file by version exists", async () => {
            nock(/.*/)
                .get("/@arkecosystem/utils")
                .reply(200, {
                    name: "@arkecosystem/utils",
                    "dist-tags": {
                        latest: "0.9.1",
                    },
                    versions: {
                        "0.9.1": {
                            name: "@arkecosystem/utils",
                            version: "0.9.1",
                            dist: {
                                tarball: "https://registry.npmjs.org/@arkecosystem/utils/-/utils-0.9.1.tgz",
                            },
                        },
                    },
                });

            await expect(source.exists("@arkecosystem/utils", "0.9.1")).resolves.toBeTrue();
        });

        it("should return false if the file by version doesn't exists", async () => {
            nock(/.*/)
                .get("/@arkecosystem/utils")
                .reply(200, {
                    name: "@arkecosystem/utils",
                    "dist-tags": {
                        latest: "0.9.1",
                    },
                    versions: {
                        "0.9.1": {
                            name: "@arkecosystem/utils",
                            version: "0.9.1",
                            dist: {
                                tarball: "https://registry.npmjs.org/@arkecosystem/utils/-/utils-0.9.1.tgz",
                            },
                        },
                    },
                });

            await expect(source.exists("@arkecosystem/utils", "0.5.5")).resolves.toBeFalse();
        });

        it("should return false if the file does not exists", async () => {
            await expect(source.exists("does not exist")).resolves.toBeFalse();
        });
    });

    describe("#update", () => {
        it("should successfully install the plugin", async () => {
            nock(/.*/)
                .get("/@arkecosystem/utils")
                .reply(200, {
                    name: "@arkecosystem/utils",
                    "dist-tags": {
                        latest: "0.9.1",
                    },
                    versions: {
                        "0.9.1": {
                            name: "@arkecosystem/utils",
                            version: "0.9.1",
                            dist: {
                                tarball: "https://registry.npmjs.org/@arkecosystem/utils/-/utils-0.9.1.tgz",
                            },
                        },
                    },
                });

            nock(/.*/)
                .get("/@arkecosystem/utils/-/utils-0.9.1.tgz")
                .reply(200, fs.readFileSync(resolve(__dirname, "utils-0.9.1.tgz")));

            // Arrange
            const removeSync = jest.spyOn(fs, "removeSync");
            const ensureFileSync = jest.spyOn(fs, "ensureFileSync");
            const moveSync = jest.spyOn(fs, "moveSync");
            const spyOnExeca = jest.spyOn(execa, "sync").mockImplementation();

            // Act
            const packageName: string = "@arkecosystem/utils";
            await source.update(packageName);

            // Assert
            const pathPlugin: string = `${dataPath}/${packageName}`;
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(ensureFileSync).toHaveBeenCalledWith(`${tempPath}/${packageName}.tgz`);
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(moveSync).toHaveBeenCalledWith(`${tempPath}/package`, pathPlugin);
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(removeSync).toHaveBeenCalledWith(`${tempPath}/${packageName}.tgz`);
            expect(spyOnExeca).toHaveBeenCalledWith(`yarn`, ["install", "--production"], {
                cwd: join(dataPath, packageName),
            });

            // Reset
            removeSync.mockReset();
            ensureFileSync.mockReset();
            moveSync.mockReset();
        });
    });
});
