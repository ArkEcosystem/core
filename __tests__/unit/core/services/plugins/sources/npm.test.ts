import "jest-extended";

import { dirSync, setGracefulCleanup } from "tmp";
import fs from "fs-extra";
import nock from "nock";

import { NPM } from "@packages/core/src/services/plugins/sources";
import { resolve } from "path";

let dataPath: string;
let tempPath: string;
let source: NPM;

beforeEach(() => {
    dataPath = dirSync().name;
    tempPath = dirSync().name;

    source = new NPM({ data: dataPath, temp: tempPath });

    nock.cleanAll();
});

beforeAll(() => {
    setGracefulCleanup();

    nock.disableNetConnect();
});

afterAll(() => nock.enableNetConnect());

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

        it("should return false if the file does not exists", async () => {
            await expect(source.exists("does not exist")).resolves.toBeFalse();
        });
    });

    describe("#install", () => {
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

            // Act
            const packageName: string = "@arkecosystem/utils";
            await source.install(packageName);

            // Assert
            const pathPlugin: string = `${dataPath}/plugins/${packageName}`;
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(ensureFileSync).toHaveBeenCalledWith(`${tempPath}/plugins/${packageName}.tgz`);
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(moveSync).toHaveBeenCalledWith(`${dataPath}/plugins/package`, pathPlugin);
            expect(removeSync).toHaveBeenCalledWith(pathPlugin);
            expect(removeSync).toHaveBeenLastCalledWith(`${tempPath}/plugins/${packageName}.tgz`);

            // Reset
            removeSync.mockReset();
            ensureFileSync.mockReset();
            moveSync.mockReset();
        });
    });
});
