import "jest-extended";

import { Console } from "@arkecosystem/core-test-framework";
import { Command } from "@packages/core/src/commands/network-generate";
import fs from "fs-extra";
import { join } from "path";
import prompts from "prompts";
import envPaths from "env-paths";

const paths = envPaths("myn", { suffix: "core" });
const configCore = join(paths.config, "testnet");
const configCrypto = join(configCore, "crypto");

let cli;
beforeEach(() => (cli = new Console()));

afterEach(() => jest.resetAllMocks());

describe("GenerateCommand", () => {
    it("should generate a new configuration", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await cli
            .withFlags({
                network: "testnet",
                premine: "120000000000",
                delegates: "47",
                blocktime: "9",
                maxTxPerBlock: "122",
                maxBlockPayload: "123444",
                rewardHeight: "23000",
                rewardAmount: "66000",
                pubKeyHash: "168",
                wif: "27",
                token: "myn",
                symbol: "my",
                explorer: "myex.io",
                distribute: "true",
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should throw if the core configuration destination already exists", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

        await expect(
            cli
                .withFlags({
                    network: "testnet",
                    premine: "120000000000",
                    delegates: "47",
                    blocktime: "9",
                    maxTxPerBlock: "122",
                    maxBlockPayload: "123444",
                    rewardHeight: "23000",
                    rewardAmount: "66000",
                    pubKeyHash: "168",
                    wif: "27",
                    token: "myn",
                    symbol: "my",
                    explorer: "myex.io",
                    distribute: "true",
                })
                .execute(Command),
        ).rejects.toThrow(`${configCore} already exists.`);
    });

    it("should throw if the crypto configuration destination already exists", async () => {
        jest.spyOn(fs, "existsSync").mockReturnValueOnce(false).mockReturnValueOnce(true);

        await expect(
            cli
                .withFlags({
                    network: "testnet",
                    premine: "120000000000",
                    delegates: "47",
                    blocktime: "9",
                    maxTxPerBlock: "122",
                    maxBlockPayload: "123444",
                    rewardHeight: "23000",
                    rewardAmount: "66000",
                    pubKeyHash: "168",
                    wif: "27",
                    token: "myn",
                    symbol: "my",
                    explorer: "myex.io",
                    distribute: "true",
                })
                .execute(Command),
        ).rejects.toThrow(`${configCrypto} already exists.`);
    });

    it("should throw if the properties are not confirmed", async () => {
        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "my",
            "myex.io",
            true,
            false,
        ]);

        await expect(cli.execute(Command)).rejects.toThrow("You'll need to confirm the input to continue.");
    });

    it("should throw if string property is undefined", async () => {
        prompts.inject([
            "undefined",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "m",
            "myex.io",
            true,
            true,
        ]);

        await expect(cli.execute(Command)).rejects.toThrow("Flag network is required.");
    });

    it("should throw if numeric property is Nan", async () => {
        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            Number.NaN,
            "myn",
            "m",
            "myex.io",
            true,
            true,
        ]);

        await expect(cli.execute(Command)).rejects.toThrow("Flag wif is required.");
    });

    it("should generate a new configuration if the properties are confirmed", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "my",
            "myex.io",
            true,
            true,
        ]);

        await cli.execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should generate a new configuration if the properties are confirmed and distribute is set to false", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            "168",
            "27",
            "myn",
            "my",
            "myex.io",
            false,
            true,
        ]);

        await cli.withFlags({ distribute: false }).execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should generate a new configuration with additional flags", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await cli
            .withFlags({
                network: "testnet",
                premine: "120000000000",
                delegates: "47",
                blocktime: "9",
                maxTxPerBlock: "122",
                maxBlockPayload: "123444",
                rewardHeight: "23000",
                rewardAmount: "66000",
                pubKeyHash: "168",
                wif: "27",
                token: "myn",
                symbol: "my",
                explorer: "myex.io",
                distribute: "true",
                epoch: "2020-11-04T00:00:00.000Z",
                feeStaticTransfer: 1,
                feeStaticSecondSignature: 2,
                feeStaticDelegateRegistration: 3,
                feeStaticVote: 4,
                feeStaticMultiSignature: 5,
                feeStaticIpfs: 6,
                feeStaticMultiPayment: 7,
                feeStaticDelegateResignation: 8,
                feeStaticHtlcLock: 9,
                feeStaticHtlcClaim: 10,
                feeStaticHtlcRefund: 11,
                coreDBHost: "127.0.0.1",
                coreDBPort: 3001,
                coreDBUsername: "username",
                coreDBPassword: "password",
                coreDBDatabase: "database",
                coreP2PPort: 3002,
                coreAPIPort: 3003,
                coreWebhooksPort: 3004,
                coreMonitorPort: 3005,
                peers: "127.0.0.1,127.0.0.2",
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should generate a new configuration using force option", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await cli
            .withFlags({
                token: "myn",
                force: true,
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should overwrite if overwriteConfig is set", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await cli
            .withFlags({
                network: "testnet",
                premine: "120000000000",
                delegates: "47",
                blocktime: "9",
                maxTxPerBlock: "122",
                maxBlockPayload: "123444",
                rewardHeight: "23000",
                rewardAmount: "66000",
                pubKeyHash: "168",
                wif: "27",
                token: "myn",
                symbol: "my",
                explorer: "myex.io",
                distribute: "true",
                overwriteConfig: "true",
            })
            .execute(Command);

        expect(existsSync).not.toHaveBeenCalled();
        expect(existsSync).not.toHaveBeenCalled();

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });

    it("should generate crypto on custom path", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();
        const copyFileSync = jest.spyOn(fs, "copyFileSync").mockImplementation();

        await cli
            .withFlags({
                network: "testnet",
                premine: "120000000000",
                delegates: "47",
                blocktime: "9",
                maxTxPerBlock: "122",
                maxBlockPayload: "123444",
                rewardHeight: "23000",
                rewardAmount: "66000",
                pubKeyHash: "168",
                wif: "27",
                token: "myn",
                symbol: "my",
                explorer: "myex.io",
                distribute: "true",
                configPath: "/path/to/config",
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith("/path/to/config/testnet");
        expect(existsSync).toHaveBeenCalledWith("/path/to/config/testnet/crypto");

        expect(ensureDirSync).toHaveBeenCalledWith("/path/to/config/testnet");
        expect(ensureDirSync).toHaveBeenCalledWith("/path/to/config/testnet/crypto");

        expect(writeJSONSync).toHaveBeenCalledTimes(7); // 5x Core + 2x Crypto

        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
        expect(copyFileSync).toHaveBeenCalledTimes(1); // App.json
    });
});
