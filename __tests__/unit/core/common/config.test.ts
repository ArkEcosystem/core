import { dirSync, setGracefulCleanup } from "tmp";

import { getConfigValue } from "@packages/core/src/common/config";
import { writeJSONSync } from "fs-extra";
import { resolve } from "path";

beforeEach(() => (process.env.CORE_PATH_CONFIG = dirSync().name));

afterAll(() => setGracefulCleanup());

describe("getConfigValue", () => {
    it("should retrieve a value by path from a JavaScript file", () => {
        const cli = {
            forger: {
                run: {
                    plugins: {
                        include: ["@arkecosystem/core-forger"],
                    },
                },
            },
            relay: {
                run: {
                    plugins: {
                        exclude: ["@arkecosystem/core-forger"],
                    },
                },
            },
        };

        process.env.CORE_PATH_CONFIG = resolve(__dirname, "__fixtures__");

        expect(getConfigValue({ token: "ark", network: "jestnet" }, "app", "cli")).toEqual(cli);
        expect(getConfigValue({ token: "ark", network: "jestnet" }, "app", "cli.forger.run.plugins.include")).toEqual(
            cli.forger.run.plugins.include,
        );
    });

    it("should retrieve a value by path from a JSON file", () => {
        const cli = {
            forger: {
                run: {
                    plugins: {
                        include: ["@arkecosystem/core-forger"],
                    },
                },
            },
            relay: {
                run: {
                    plugins: {
                        exclude: ["@arkecosystem/core-forger"],
                    },
                },
            },
        };

        writeJSONSync(`${process.env.CORE_PATH_CONFIG}/app.json`, {
            cli,
        });

        expect(getConfigValue({ token: "ark", network: "jestnet" }, "app", "cli")).toEqual(cli);
        expect(getConfigValue({ token: "ark", network: "jestnet" }, "app", "cli.forger.run.plugins.include")).toEqual(
            cli.forger.run.plugins.include,
        );
    });

    // it("should throw if the file doesn't exist", () => {
    //     expect(() => getConfigValue({ token: "ark", network: "jestnet" }, "app", "cli")).toThrowError(
    //         `The app file does not exist.`,
    //     );
    // });
});
