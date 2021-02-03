import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/config-manager";
import envfile from "envfile";
import fs from "fs-extra";
import prompts from "prompts";
import { dirSync, setGracefulCleanup } from "tmp";

let cli;
let envFile: string;
let appJsonFile: string;

const appJson = {
    core: {},
    relay: {},
    forger: {},
    snapshot: {},
};

beforeEach(() => {
    process.env.CORE_PATH_CONFIG = dirSync().name;

    envFile = `${process.env.CORE_PATH_CONFIG}/.env`;
    appJsonFile = `${process.env.CORE_PATH_CONFIG}/app.json`;

    cli = new Console();
});

afterAll(() => setGracefulCleanup());

describe("ConfigManagerCommand", () => {
    describe("Flags", () => {
        it("should set the manager host, port and create manager section", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
            const readJSONSync = jest.spyOn(fs, "readJSONSync").mockReturnValue(appJson);
            const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

            // Act
            await cli.withFlags({ host: "127.0.0.1", port: 4000 }).execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_HOST=127.0.0.1"));
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_PORT=4000"));
            expect(readJSONSync).toHaveBeenCalledWith(appJsonFile);
            expect(writeJSONSync).toHaveBeenCalledWith(
                appJsonFile,
                {
                    core: expect.toBeObject(),
                    forger: expect.toBeObject(),
                    relay: expect.toBeObject(),
                    snapshot: expect.toBeObject(),
                    manager: {
                        plugins: [
                            {
                                package: "@arkecosystem/core-logger-pino",
                            },
                            {
                                package: "@arkecosystem/core-snapshots",
                            },
                            {
                                package: "@arkecosystem/core-manager",
                            },
                        ],
                    },
                },
                { spaces: 4 },
            );

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
            readJSONSync.mockReset();
            writeJSONSync.mockReset();
        });
    });

    describe("Prompts", () => {
        it("should throw if configuration is not confirmed", async () => {
            prompts.inject(["127.0.0.1", 4000, undefined, "none", false]);

            await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the input to continue.");
        });

        it("should set the manager host, port and create manager section", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
            const readJSONSync = jest.spyOn(fs, "readJSONSync").mockReturnValue(appJson);
            const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

            // Act
            prompts.inject(["127.0.0.1", 4000, undefined, "none", true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_HOST=127.0.0.1"));
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_PORT=4000"));
            expect(readJSONSync).toHaveBeenCalledWith(appJsonFile);
            expect(writeJSONSync).toHaveBeenCalledWith(
                appJsonFile,
                {
                    core: expect.toBeObject(),
                    forger: expect.toBeObject(),
                    relay: expect.toBeObject(),
                    snapshot: expect.toBeObject(),
                    manager: {
                        plugins: [
                            {
                                package: "@arkecosystem/core-logger-pino",
                            },
                            {
                                package: "@arkecosystem/core-snapshots",
                            },
                            {
                                package: "@arkecosystem/core-manager",
                            },
                        ],
                    },
                },
                { spaces: 4 },
            );

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
            readJSONSync.mockReset();
            writeJSONSync.mockReset();
        });

        it("should set the whitelist", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
            const readJSONSync = jest.spyOn(fs, "readJSONSync").mockReturnValue(appJson);
            const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

            // Act
            prompts.inject(["127.0.0.1", 4000, "127.0.0.1, 192.168.1.1", "none", true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_HOST=127.0.0.1"));
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_PORT=4000"));
            expect(readJSONSync).toHaveBeenCalledWith(appJsonFile);
            expect(writeJSONSync).toHaveBeenCalledWith(
                appJsonFile,
                {
                    core: expect.toBeObject(),
                    forger: expect.toBeObject(),
                    relay: expect.toBeObject(),
                    snapshot: expect.toBeObject(),
                    manager: {
                        plugins: [
                            {
                                package: "@arkecosystem/core-logger-pino",
                            },
                            {
                                package: "@arkecosystem/core-snapshots",
                            },
                            {
                                package: "@arkecosystem/core-manager",
                                options: {
                                    plugins: {
                                        whitelist: ["127.0.0.1", "192.168.1.1"],
                                    },
                                },
                            },
                        ],
                    },
                },
                { spaces: 4 },
            );

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
            readJSONSync.mockReset();
            writeJSONSync.mockReset();
        });

        it("should set the token authentication", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
            const readJSONSync = jest.spyOn(fs, "readJSONSync").mockReturnValue(appJson);
            const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

            // Act
            prompts.inject(["127.0.0.1", 4000, undefined, "token", "secret_token", true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_HOST=127.0.0.1"));
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_PORT=4000"));
            expect(readJSONSync).toHaveBeenCalledWith(appJsonFile);
            expect(writeJSONSync).toHaveBeenCalledWith(
                appJsonFile,
                {
                    core: expect.toBeObject(),
                    forger: expect.toBeObject(),
                    relay: expect.toBeObject(),
                    snapshot: expect.toBeObject(),
                    manager: {
                        plugins: [
                            {
                                package: "@arkecosystem/core-logger-pino",
                            },
                            {
                                package: "@arkecosystem/core-snapshots",
                            },
                            {
                                package: "@arkecosystem/core-manager",
                                options: {
                                    plugins: {
                                        tokenAuthentication: {
                                            enabled: true,
                                            token: "secret_token",
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                { spaces: 4 },
            );

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
            readJSONSync.mockReset();
            writeJSONSync.mockReset();
        });

        it("should set the basic authentication", async () => {
            // Arrange
            const existsSync = jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);
            const parseFileSync = jest.spyOn(envfile, "parseFileSync").mockImplementation(() => ({}));
            const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
            const readJSONSync = jest.spyOn(fs, "readJSONSync").mockReturnValue(appJson);
            const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();

            // Act
            prompts.inject(["127.0.0.1", 4000, undefined, "basic", "username", "password", true]);

            await cli.execute(Command);

            // Assert
            expect(existsSync).toHaveBeenCalledWith(envFile);
            expect(parseFileSync).toHaveBeenCalledWith(envFile);
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_HOST=127.0.0.1"));
            expect(writeFileSync).toHaveBeenCalledWith(envFile, expect.toInclude("CORE_MONITOR_PORT=4000"));
            expect(readJSONSync).toHaveBeenCalledWith(appJsonFile);
            expect(writeJSONSync).toHaveBeenCalledWith(
                appJsonFile,
                {
                    core: expect.toBeObject(),
                    forger: expect.toBeObject(),
                    relay: expect.toBeObject(),
                    snapshot: expect.toBeObject(),
                    manager: {
                        plugins: [
                            {
                                package: "@arkecosystem/core-logger-pino",
                            },
                            {
                                package: "@arkecosystem/core-snapshots",
                            },
                            {
                                package: "@arkecosystem/core-manager",
                                options: {
                                    plugins: {
                                        basicAuthentication: {
                                            enabled: true,
                                            secret: expect.toBeString(),
                                            users: [
                                                {
                                                    password: expect.toBeString(),
                                                    username: "username",
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                { spaces: 4 },
            );

            // Reset
            existsSync.mockReset();
            parseFileSync.mockReset();
            writeFileSync.mockReset();
            readJSONSync.mockReset();
            writeJSONSync.mockReset();
        });
    });
});
