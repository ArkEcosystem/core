import "jest-extended";

import "../mocks/core-container";

import { Database, State } from "@arkecosystem/core-interfaces";
import { delegateCalculator } from "@arkecosystem/core-utils";
import { Utils } from "@arkecosystem/crypto";
import { DelegatesBusinessRepository, WalletsBusinessRepository } from "../../../../packages/core-database/src";
import { DatabaseService } from "../../../../packages/core-database/src/database-service";
import { Wallet, WalletManager } from "../../../../packages/core-state/src/wallets";
import { Address } from "../../../../packages/crypto/src/identities";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";

let repository;

let walletsRepository: Database.IWalletsBusinessRepository;
let walletManager: State.IWalletManager;
let databaseService: Database.IDatabaseService;

beforeEach(async () => {
    walletManager = new WalletManager();

    repository = new DelegatesBusinessRepository(() => databaseService);
    walletsRepository = new WalletsBusinessRepository(() => databaseService);
    databaseService = new DatabaseService(
        undefined,
        undefined,
        walletManager,
        walletsRepository,
        repository,
        undefined,
        undefined,
    );
});

const generateWallets = (): Wallet[] => {
    return genesisBlock.transactions.map((transaction, index) => {
        // @TODO: switch to unitnet
        const address: string = Address.fromPublicKey(transaction.data.senderPublicKey, 23);

        return {
            address,
            publicKey: `publicKey-${address}`,
            secondPublicKey: `secondPublicKey-${address}`,
            vote: `vote-${address}`,
            username: `username-${address}`,
            balance: Utils.BigNumber.make(100),
            voteBalance: Utils.BigNumber.make(200),
            rate: index + 1,
        } as Wallet;
    });
};

describe("Delegate Repository", () => {
    describe("search", () => {
        const delegates = [
            { username: "delegate-0", forgedFees: Utils.BigNumber.make(10), forgedRewards: Utils.BigNumber.make(10) },
            { username: "delegate-1", forgedFees: Utils.BigNumber.make(20), forgedRewards: Utils.BigNumber.make(20) },
            { username: "delegate-2", forgedFees: Utils.BigNumber.make(30), forgedRewards: Utils.BigNumber.make(30) },
        ];

        const wallets = [delegates[0], {}, delegates[1], { username: "" }, delegates[2], {}].map(delegate => {
            const wallet = new Wallet("");
            return Object.assign(wallet, delegate);
        });

        beforeEach(() => {
            const wallets = generateWallets();
            walletManager.index(wallets);
        });

        it("should return the local wallets of the connection that are delegates", () => {
            jest.spyOn(walletManager, "allByUsername").mockReturnValue(wallets);

            const { rows } = repository.search();

            expect(rows).toEqual(expect.arrayContaining(wallets));
            expect(walletManager.allByUsername).toHaveBeenCalled();
        });

        it("should be ok with params (forgedTotal)", () => {
            // @ts-ignore
            jest.spyOn(walletManager, "allByUsername").mockReturnValue(wallets);

            const { rows } = repository.search({ forgedTotal: undefined });

            for (const delegate of rows) {
                expect(delegate.hasOwnProperty("forgedTotal"));
                expect(+delegate.forgedTotal.toFixed()).toBe(delegateCalculator.calculateForgedTotal(delegate));
            }
        });

        it("should be ok without params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.search({});
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
            expect(rows.sort((a, b) => a.rate < b.rate)).toEqual(rows);
        });

        it("should be ok with params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.search({ offset: 10, limit: 10, orderBy: "rate:desc" });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
            expect(rows.sort((a, b) => a.rate > b.rate)).toEqual(rows);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.search({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.search({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.search({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
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
                    walletManager.allByAddress()[0].username = "undefined";

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

        describe("by `usernames`", () => {
            it("should search by exact match", () => {
                const usernames = [
                    "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                    "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    "username-AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
                ];
                const { count, rows } = repository.search({ usernames });

                expect(count).toBe(3);
                expect(rows).toHaveLength(3);

                rows.forEach(row => {
                    expect(usernames.includes(row.username)).toBeTrue();
                });
            });

            describe('when a username is "undefined"', () => {
                it("should return it", () => {
                    // Index a wallet with username "undefined"
                    walletManager.allByAddress()[0].username = "undefined";

                    const usernames = ["undefined"];
                    const { count, rows } = repository.search({ usernames });

                    expect(count).toBe(1);
                    expect(rows).toHaveLength(1);
                    expect(rows[0].username).toEqual(usernames[0]);
                });
            });

            describe("when the username does not exist", () => {
                it("should return no results", () => {
                    const { count, rows } = repository.search({
                        usernames: ["unknown-dummy-username"],
                    });

                    expect(count).toBe(0);
                    expect(rows).toHaveLength(0);
                });
            });

            it("should be ok with params", () => {
                const { count, rows } = repository.search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 1,
                    limit: 10,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (no offset)", () => {
                const { count, rows } = repository.search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    limit: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });

            it("should be ok with params (offset = 0)", () => {
                const { count, rows } = repository.search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 0,
                    limit: 2,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(2);
            });

            it("should be ok with params (no limit)", () => {
                const { count, rows } = repository.search({
                    usernames: [
                        "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn",
                        "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    ],
                    offset: 1,
                });
                expect(count).toBe(2);
                expect(rows).toHaveLength(1);
            });
        });

        describe("when searching by `username` and `usernames`", () => {
            it("should search delegates only by `username`", () => {
                const username = "username-APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn";
                const usernames = [
                    "username-AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo",
                    "username-AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri",
                ];

                const { count, rows } = repository.search({ username, usernames });

                expect(count).toBe(1);
                expect(rows).toHaveLength(1);
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
                    walletManager.allByAddress()[0].username = "undefined";

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
});
