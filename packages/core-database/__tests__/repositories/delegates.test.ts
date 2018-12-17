import { Bignum, constants, crypto, models } from "@arkecosystem/crypto";
import genesisBlockTestnet from "../../../core-test-utils/src/config/testnet/genesisBlock.json";

import { delegateCalculator } from "@arkecosystem/core-utils";
import { DelegatesRepository } from "../../src/repositories/delegates";
import { setUp, tearDown } from "../__support__/setup";

const { ARKTOSHI } = constants;
const { Block } = models;

let genesisBlock;
let repository;
let walletManager;

beforeAll(async done => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(genesisBlockTestnet);

    done();
});

afterAll(async done => {
    await tearDown();

    done();
});

beforeEach(async done => {
    const { WalletManager } = require("../../src/wallet-manager");
    walletManager = new WalletManager();

    repository = new DelegatesRepository({
        walletManager,
    });

    done();
});

function generateWallets() {
    return genesisBlock.transactions.map((transaction, index) => {
        const address = crypto.getAddress(transaction.senderPublicKey);

        return {
            address,
            publicKey: `publicKey-${address}`,
            secondPublicKey: `secondPublicKey-${address}`,
            vote: `vote-${address}`,
            username: `username-${address}`,
            balance: new Bignum(100),
            voteBalance: new Bignum(200),
            rate: index + 1,
        };
    });
}

describe("Delegate Repository", () => {
    describe("getLocalDelegates", () => {
        const delegates = [{ username: "delegate-0" }, { username: "delegate-1" }, { username: "delegate-2" }];
        const wallets = [delegates[0], {}, delegates[1], { username: "" }, delegates[2], {}];

        it("should return the local wallets of the connection that are delegates", () => {
            repository.connection.walletManager.all = jest.fn(() => wallets);

            expect(repository.getLocalDelegates()).toEqual(expect.arrayContaining(delegates));
            expect(repository.connection.walletManager.all).toHaveBeenCalled();
        });
    });

    describe("findAll", () => {
        it("should be ok without params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll();
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
            expect(rows.sort((a, b) => a.rate < b.rate)).toEqual(rows);
        });

        it("should be ok with params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll({ offset: 10, limit: 10, orderBy: "rate:desc" });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
            expect(rows.sort((a, b) => a.rate > b.rate)).toEqual(rows);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });
    });

    describe("paginate", () => {
        it("should be ok without params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.paginate();
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
            expect(rows.sort((a, b) => a.rate < b.rate)).toEqual(rows);
        });

        it("should be ok with params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.paginate({ offset: 10, limit: 10, orderBy: "rate:desc" });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
            expect(rows.sort((a, b) => a.rate > b.rate)).toEqual(rows);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.paginate({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.paginate({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.paginate({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });
    });

    describe("search", () => {
        beforeEach(() => {
            const wallets = generateWallets();
            walletManager.index(wallets);
        });

        describe("by `username`", () => {
            it("should search by exact match", () => {
                const username = "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn";
                const { count, rows } = repository.search({ username });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
                expect(rows[0].username).toEqual(username);
            });

            it("should search that username contains the string", () => {
                const { count, rows } = repository.search({ username: "username" });

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return it", () => {
                    // Index a wallet with username "undefined"
                    const address = Object.keys(walletManager.byAddress)[0];
                    walletManager.byAddress[address].username = "undefined";

                    const username = "undefined";
                    const { count, rows } = repository.search({ username });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].username).toEqual(username);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", () => {
                    const { count, rows } = repository.search({
                        username: "unknown-dummy-username",
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", () => {
                const { count, rows } = repository.search({
                    username: "username",
                    offset: 10,
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (no offset)", () => {
                const { count, rows } = repository.search({
                    username: "username",
                    limit: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(10);
            });

            it("should be ok with params (offset = 0)", () => {
                const { count, rows } = repository.search({
                    username: "username",
                    offset: 0,
                    limit: 12,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(12);
            });

            it("should be ok with params (no limit)", () => {
                const { count, rows } = repository.search({
                    username: "username",
                    offset: 10,
                });
                expect(count).toBe(52);
                expect(rows).toHaveLength(42);
            });
        });

        describe("when searching without params", () => {
            it("should return all results", () => {
                const { count, rows } = repository.search({});

                expect(count).toBe(52);
                expect(rows).toHaveLength(52);
            });

            describe('when a username is "undefined"', () => {
                it("should return all results", () => {
                    // Index a wallet with username "undefined"
                    const address = Object.keys(walletManager.byAddress)[0];
                    walletManager.byAddress[address].username = "undefined";

                    const { count, rows } = repository.search({});
                    expect(count).toBe(52);
                    expect(rows).toHaveLength(52);
                });
            });
        });
    });

    describe("findById", () => {
        const expectWallet = key => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const wallet = repository.findById(wallets[0][key]);
            expect(wallet).toBeObject();
            expect(wallet.address).toBe(wallets[0].address);
            expect(wallet.publicKey).toBe(wallets[0].publicKey);
            expect(wallet.username).toBe(wallets[0].username);
        };

        it("should be ok with an address", () => {
            expectWallet("address");
        });

        it("should be ok with a publicKey", () => {
            expectWallet("publicKey");
        });

        it("should be ok with a username", () => {
            expectWallet("username");
        });
    });

    describe("getActiveAtHeight", () => {
        it("should be ok", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const delegate = {
                username: "test",
                publicKey: "test",
                voteBalance: new Bignum(10000 * ARKTOSHI),
                producedBlocks: 1000,
                missedBlocks: 500,
            };
            const height = 1;

            repository.connection.getActiveDelegates = jest.fn(() => [delegate]);
            repository.connection.wallets = {
                findById: jest.fn(() => delegate),
            };

            const results = repository.getActiveAtHeight(height);

            expect(results).toBeArray();
            expect(results[0].username).toBeString();
            expect(results[0].approval).toBeNumber();
            expect(results[0].productivity).toBeNumber();
            expect(results[0].approval).toBe(delegateCalculator.calculateApproval(delegate, height));
            expect(results[0].productivity).toBe(delegateCalculator.calculateProductivity(delegate));
        });
    });
});
