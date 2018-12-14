import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import clipboardy from "clipboardy";
import "jest-extended";
import fill from "lodash/fill";
import { Command } from "../../src/commands/command";
import { Transfer } from "../../src/commands/transfer";
import { logger } from "../../src/utils";

const mockAxios = new MockAdapter(axios);

class DummyCommand extends Command {
    public async run(options) {
        return true;
    }
}

let command;
beforeEach(() => {
    command = new DummyCommand();
    mockAxios.reset();
});

describe("Command Base", () => {
    describe("Init", () => {
        it("initialize with option", async () => {
            mockAxios
                .onGet("http://test_baseUrl:1234/api/v2/node/configuration")
                .reply(200, { data: { constants: {} } });
            mockAxios.onGet("http://test_baseUrl:4321/config").reply(200, { data: { network: {} } });
            command = await Command.initialize(new Transfer(), {
                baseUrl: "http://test_baseUrl",
                apiPort: 1234,
                p2pPort: 4321,
                passphrase: "test_passphrase",
                secondPassphrase: "test_secondPassphrase",
            });
            expect(command.config).toContainEntries([
                ["baseUrl", "http://test_baseUrl"],
                ["apiPort", 1234 as any],
                ["p2pPort", 4321 as any],
                ["passphrase", "test_passphrase"],
                ["secondPassphrase", "test_secondPassphrase"],
            ]);
        });
    });

    describe("Copy to Clipboard", () => {
        it("should contain the copied content", () => {
            command.copyToClipboard([
                {
                    key: "value",
                    serialized: "00",
                },
            ]);

            expect(JSON.parse(clipboardy.readSync())).toEqual([
                {
                    key: "value",
                    serialized: "00",
                },
            ]);
        });
    });

    describe("Generate Wallets", () => {
        it("generate wallets", () => {
            command.config = {
                network: {
                    version: 1,
                },
            };
            const wallets = command.generateWallets(10);
            expect(wallets).toBeArrayOfSize(10);
            wallets.forEach(wallet => {
                expect(wallet).toContainAllKeys(["address", "keys", "passphrase"]);
            });
        });
    });

    describe("getDelegates", () => {
        it("should get delegates", async () => {
            const delegatePage1Fixture = require("../__fixtures__/delegates-page-1.json");
            const delegatePage2Fixture = require("../__fixtures__/delegates-page-2.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet("http://baseUrl:1234/api/v2/delegates?page=1").reply(200, delegatePage1Fixture);
            mockAxios.onGet("http://baseUrl:1234/api/v2/delegates?page=2").reply(200, delegatePage2Fixture);

            expect(await command.getDelegates()).toIncludeSameMembers([
                ...delegatePage1Fixture.data,
                ...delegatePage2Fixture.data,
            ]);
        });
    });

    describe("getTransactionDelaySeconds", () => {
        it("should delay correct", () => {
            command.config = {
                constants: {
                    blocktime: 8,
                    block: {
                        maxTransactions: 10,
                    },
                },
            };

            // 1 Block
            expect(command.getTransactionDelaySeconds(fill(Array(5), true))).toBe(20);
            expect(command.getTransactionDelaySeconds(fill(Array(10), true))).toBe(20);
            // 2 Block
            expect(command.getTransactionDelaySeconds(fill(Array(15), true))).toBe(40);
            // 10 Block
            expect(command.getTransactionDelaySeconds(fill(Array(100), true))).toBe(200);
        });
    });

    describe("getTransaction", () => {
        it("should get transaction", async () => {
            const transactionFixture = require("../__fixtures__/transaction-1.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet(`http://baseUrl:1234/api/v2/transactions/${transactionFixture.id}`).reply(200, {
                data: transactionFixture,
            });

            expect(await command.getTransaction(transactionFixture.id)).toEqual(transactionFixture);
        });
    });

    describe("getVoters", () => {
        it("should get voters", async () => {
            const voterPage1Fixture = require("../__fixtures__/voters-page-1.json");
            const voterPage2Fixture = require("../__fixtures__/voters-page-2.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet("http://baseUrl:1234/api/v2/delegates/1/voters?page=1").reply(200, voterPage1Fixture);
            mockAxios.onGet("http://baseUrl:1234/api/v2/delegates/1/voters?page=2").reply(200, voterPage2Fixture);

            expect(await command.getVoters(1)).toIncludeSameMembers([
                ...voterPage1Fixture.data,
                ...voterPage2Fixture.data,
            ]);
        });
    });

    describe("getWalletBalance", () => {
        it("should get transaction", async () => {
            const walletFixture = require("../__fixtures__/wallet-1.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet(`http://baseUrl:1234/api/v2/wallets/${walletFixture.address}`).reply(200, {
                data: walletFixture,
            });

            expect((await command.getWalletBalance(walletFixture.address)).toNumber()).toBe(walletFixture.balance);
        });
    });

    describe("getWallet", () => {
        it("should get transaction", async () => {
            const walletFixture = require("../__fixtures__/wallet-1.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet(`http://baseUrl:1234/api/v2/wallets/${walletFixture.address}`).reply(200, {
                data: walletFixture,
            });

            expect(await command.getWallet(walletFixture.address)).toEqual(walletFixture);
        });
    });

    describe("static parseFee", () => {
        it("should give arktoshi", () => {
            expect(Command.parseFee(0.1).toString()).toBe("10000000");
            expect(Command.parseFee(1).toString()).toBe("100000000");
            expect(Command.parseFee(10).toString()).toBe("1000000000");
            expect(Command.parseFee("0.1").toString()).toBe("10000000");
            expect(Command.parseFee("1").toString()).toBe("100000000");
            expect(Command.parseFee("10").toString()).toBe("1000000000");
            expect(Command.parseFee("0.001-0.005").toNumber()).toBeWithin(100000, 500000);
        });
    });

    describe("sendTransactions", () => {
        it("should send and wait", async () => {
            const responseFixture = require("../__fixtures__/transaction-response-1.json");
            const loggerInfo = logger.info;
            logger.info = jest.fn();
            command.getTransactionDelaySeconds = jest.fn(() => 1);
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onPost(`http://baseUrl:1234/api/v2/transactions`).reply(200, {
                data: responseFixture,
            });

            const start = new Date().getTime();
            const response = await command.sendTransactions([], "test");
            const end = new Date().getTime();

            expect(response).toEqual(responseFixture);
            expect(command.getTransactionDelaySeconds).toHaveBeenCalledTimes(1);
            expect(Math.round((end - start) / 1000)).toBeGreaterThanOrEqual(1);
            expect(logger.info).toHaveBeenCalledWith("Waiting 1 seconds to apply test transactions");
            logger.info = loggerInfo;
        });
    });

    describe("postTransactions", () => {
        it("should send transaction", async () => {
            const responseFixture = require("../__fixtures__/transaction-response-1.json");
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onPost(`http://baseUrl:1234/api/v2/transactions`).reply(200, {
                data: responseFixture,
            });

            expect(await command.postTransactions([])).toEqual(responseFixture);
        });
    });

    describe("__applyConfig", () => {
        it("should sets constant", () => {
            command.options = {
                baseUrl: "http://baseUrl///",
                apiPort: 1234,
                p2pPort: 4321,
                passphrase: "test_passphrase",
                secondPassphrase: "test_secondPassphrase",
            };

            command.__applyConfig();

            expect(command.config.baseUrl).toBe("http://baseUrl");
            expect(command.config.apiPort).toBe(1234);
            expect(command.config.p2pPort).toBe(4321);
            expect(command.config.passphrase).toBe("test_passphrase");
            expect(command.config.secondPassphrase).toBe("test_secondPassphrase");
        });
    });

    describe("__loadConstants", () => {
        it("should sets constant", async () => {
            command.config = {
                baseUrl: "http://baseUrl",
                apiPort: 1234,
            };
            mockAxios.onGet("http://baseUrl:1234/api/v2/node/configuration").reply(200, {
                data: {
                    constants: {
                        testConstant: true,
                        testConstant2: "test",
                    },
                },
            });

            await command.__loadConstants();

            expect(command.config.constants).toContainAllEntries([
                ["testConstant", true as any],
                ["testConstant2", "test"],
            ]);
        });
    });

    describe("__loadNetworkConfig", () => {
        it("should sets constant", async () => {
            command.config = {
                baseUrl: "http://baseUrl",
                p2pPort: 4321,
            };
            mockAxios.onGet("http://baseUrl:4321/config").reply(200, {
                data: {
                    network: {
                        testConfig: true,
                        testConfig2: "test",
                    },
                },
            });

            await command.__loadNetworkConfig();

            expect(command.config.network).toContainAllEntries([["testConfig", true as any], ["testConfig2", "test"]]);
        });
    });

    describe("static __arkToArktoshi", () => {
        it("should give arktoshi", () => {
            expect(Command.__arkToArktoshi(0.00000001).toString()).toBe("1");
            expect(Command.__arkToArktoshi(0.1).toString()).toBe("10000000");
            expect(Command.__arkToArktoshi(1).toString()).toBe("100000000");
            expect(Command.__arkToArktoshi(10).toString()).toBe("1000000000");
        });
    });

    describe("static __arktoshiToArk", () => {
        it("should give ark", () => {
            expect(Command.__arktoshiToArk(1)).toBe("0.00000001 DѦ");
            expect(Command.__arktoshiToArk(10000000)).toBe("0.1 DѦ");
            expect(Command.__arktoshiToArk(100000000)).toBe("1 DѦ");
            expect(Command.__arktoshiToArk(1000000000)).toBe("10 DѦ");
        });
    });

    describe("__problemSendingTransactions", () => {
        it("should log message and exit", () => {
            const processExit = process.exit;
            const loggerError = logger.error;
            // @ts-ignore
            process.exit = jest.fn();
            logger.error = jest.fn();
            const message = "__problemSendingTransactions message";
            command.__problemSendingTransactions({
                message,
            });
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.error).toHaveBeenCalledWith(`There was a problem sending transactions: ${message}`);
            expect(process.exit).toHaveBeenCalledTimes(1);
            process.exit = processExit;
            logger.error = loggerError;
        });
    });
});
