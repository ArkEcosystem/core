import "jest-extended";

import { Console } from "@packages/core-test-framework";
import { Command } from "@packages/core/src/commands/network-generate";
import envPaths from "env-paths";
import fs from "fs-extra";
import { join } from "path";
import prompts from "prompts";

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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env

        expect(writeJSONSync).toHaveBeenCalledWith(
            expect.stringContaining("crypto/milestones.json"),
            [
                {
                    height: 1,
                    reward: "0",
                    activeDelegates: 47,
                    blocktime: 9,
                    block: {
                        version: 0,
                        idFullSha256: true,
                        maxTransactions: 122,
                        maxPayload: 123444,
                    },
                    epoch: expect.any(String),
                    fees: {
                        staticFees: {
                            transfer: 10000000,
                            secondSignature: 500000000,
                            delegateRegistration: 2500000000,
                            vote: 100000000,
                            multiSignature: 500000000,
                            ipfs: 500000000,
                            multiPayment: 10000000,
                            delegateResignation: 2500000000,
                            htlcLock: 10000000,
                            htlcClaim: 0,
                            htlcRefund: 0,
                        },
                    },
                    vendorFieldLength: 255,
                    multiPaymentLimit: 256,
                    aip11: true,
                },
                {
                    height: 23000,
                    reward: 66000,
                },
            ],
            { spaces: 4 },
        );
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

        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            168,
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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });

    it("should generate a new configuration if the properties are confirmed and distribute is set to false", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

        prompts.inject([
            "testnet",
            "120000000000",
            "47",
            "9",
            "122",
            "123444",
            "23000",
            "66000",
            168,
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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });

    it("should generate a new configuration with additional flags", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

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
                vendorFieldLength: "64",
                wif: "27",
                token: "myn",
                symbol: "my",
                explorer: "myex.io",
                distribute: "true",
                epoch: "2020-11-04T00:00:00.000Z",
                htlcEnabled: true,
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
                feeDynamicEnabled: true,
                feeDynamicMinFeePool: 100,
                feeDynamicMinFeeBroadcast: 200,
                feeDynamicBytesTransfer: 1,
                feeDynamicBytesSecondSignature: 2,
                feeDynamicBytesDelegateRegistration: 3,
                feeDynamicBytesVote: 4,
                feeDynamicBytesMultiSignature: 5,
                feeDynamicBytesIpfs: 6,
                feeDynamicBytesMultiPayment: 7,
                feeDynamicBytesDelegateResignation: 8,
                feeDynamicBytesHtlcLock: 9,
                feeDynamicBytesHtlcClaim: 10,
                feeDynamicBytesHtlcRefund: 11,
                coreDBHost: "127.0.0.1",
                coreDBPort: 3001,
                coreDBUsername: "username",
                coreDBPassword: "password",
                coreDBDatabase: "database",
                coreP2PPort: 3002,
                coreAPIPort: 3003,
                coreWebhooksPort: 3004,
                coreMonitorPort: 3005,
                peers: "127.0.0.1:4444,127.0.0.2",
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env

        expect(writeJSONSync).toHaveBeenCalledWith(
            expect.stringContaining("crypto/milestones.json"),
            [
                {
                    height: 1,
                    reward: "0",
                    activeDelegates: 47,
                    blocktime: 9,
                    block: {
                        version: 0,
                        idFullSha256: true,
                        maxTransactions: 122,
                        maxPayload: 123444,
                    },
                    epoch: "2020-11-04T00:00:00.000Z",
                    fees: {
                        staticFees: {
                            transfer: 1,
                            secondSignature: 2,
                            delegateRegistration: 3,
                            vote: 4,
                            multiSignature: 5,
                            ipfs: 6,
                            multiPayment: 7,
                            delegateResignation: 8,
                            htlcLock: 9,
                            htlcClaim: 10,
                            htlcRefund: 11,
                        },
                    },
                    vendorFieldLength: 64,
                    multiPaymentLimit: 256,
                    htlcEnabled: true,
                    aip11: true,
                },
                {
                    height: 23000,
                    reward: 66000,
                },
            ],
            { spaces: 4 },
        );
    });

    it("should generate a new configuration using force option", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });

    it("should overwrite if overwriteConfig is set", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });

    it("should generate crypto on custom path", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

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

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });

    it("should allow empty peers", async () => {
        const existsSync = jest.spyOn(fs, "existsSync").mockImplementation();
        const ensureDirSync = jest.spyOn(fs, "ensureDirSync").mockImplementation();
        const writeJSONSync = jest.spyOn(fs, "writeJSONSync").mockImplementation();
        const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation();

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
                peers: "",
            })
            .execute(Command);

        expect(existsSync).toHaveBeenCalledWith(configCore);
        expect(existsSync).toHaveBeenCalledWith(configCrypto);

        expect(ensureDirSync).toHaveBeenCalledWith(configCore);
        expect(ensureDirSync).toHaveBeenCalledWith(configCrypto);

        expect(writeJSONSync).toHaveBeenCalledTimes(8); // 5x Core + 2x Crypto + App
        expect(writeFileSync).toHaveBeenCalledTimes(2); // index.ts && .env
    });
});
