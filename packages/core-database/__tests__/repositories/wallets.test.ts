import { Bignum, crypto, models } from "@arkecosystem/crypto";
import { compact, uniq } from "@arkecosystem/utils";
import genesisBlockTestnet from "../../../core-test-utils/src/config/testnet/genesisBlock.json";
import { setUp, tearDown } from "../__support__/setup";

import { WalletsRepository } from "../../src/repositories/wallets";

const { Block } = models;

let genesisBlock;
let genesisSenders;
let repository;
let walletManager;

beforeAll(async done => {
    await setUp();

    // Create the genesis block after the setup has finished or else it uses a potentially
    // wrong network config.
    genesisBlock = new Block(genesisBlockTestnet);
    genesisSenders = uniq(compact(genesisBlock.transactions.map(tx => tx.senderPublicKey)));

    done();
});

afterAll(async done => {
    await tearDown();

    done();
});

beforeEach(async done => {
    const { WalletManager } = require("../../src/wallet-manager");
    walletManager = new WalletManager();

    repository = new WalletsRepository({
        walletManager,
    });

    done();
});

function generateWallets() {
    return genesisSenders.map(senderPublicKey => ({
        address: crypto.getAddress(senderPublicKey),
    }));
}

function generateVotes() {
    return genesisSenders.map(senderPublicKey => ({
        address: crypto.getAddress(senderPublicKey),
        vote: genesisBlock.transactions[0].senderPublicKey,
    }));
}

function generateFullWallets() {
    return genesisSenders.map(senderPublicKey => {
        const address = crypto.getAddress(senderPublicKey);

        return {
            address,
            publicKey: `publicKey-${address}`,
            secondPublicKey: `secondPublicKey-${address}`,
            vote: `vote-${address}`,
            username: `username-${address}`,
            balance: 100,
            voteBalance: 200,
        };
    });
}

describe("Wallet Repository", () => {
    describe("all", () => {
        it("should return the local wallets of the connection", () => {
            repository.connection.walletManager.all = jest.fn();
            repository.all();
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
        });

        it("should be ok with params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = repository.findAll({ offset: 10, limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
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

    describe("findAllByVote", () => {
        const vote = "dummy-sender-public-key";

        beforeEach(() => {
            const wallets = generateVotes();
            wallets.forEach((wallet, i) => {
                if (i < 17) {
                    wallet.vote = vote;
                }
            });
            walletManager.index(wallets);
        });

        it("should be ok without params", () => {
            const { count, rows } = repository.findAllByVote(vote);
            expect(count).toBe(17);
            expect(rows).toHaveLength(17);
        });

        it("should be ok with params", () => {
            const { count, rows } = repository.findAllByVote(vote, {
                offset: 10,
                limit: 10,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(7);
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = repository.findAllByVote(vote, { limit: 10 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = repository.findAllByVote(vote, {
                offset: 0,
                limit: 1,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(1);
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = repository.findAllByVote(vote, { offset: 30 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(0);
        });
    });

    describe("findById", () => {
        const expectWallet = key => {
            const wallets = generateFullWallets();
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

    describe("count", () => {
        it("should be ok", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            expect(repository.count()).toBe(52);
        });
    });

    describe("top", () => {
        beforeEach(() => {
            walletManager.reindex({ address: "dummy-1", balance: new Bignum(1000) });
            walletManager.reindex({ address: "dummy-2", balance: new Bignum(2000) });
            walletManager.reindex({ address: "dummy-3", balance: new Bignum(3000) });
        });

        it("should be ok without params", () => {
            const { count, rows } = repository.top();

            expect(count).toBe(3);
            expect(rows.length).toBe(3);
            expect(rows[0].balance).toEqual(new Bignum(3000));
            expect(rows[1].balance).toEqual(new Bignum(2000));
            expect(rows[2].balance).toEqual(new Bignum(1000));
        });

        it("should be ok with params", () => {
            const { count, rows } = repository.top({ offset: 1, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(new Bignum(2000));
            expect(rows[1].balance).toEqual(new Bignum(1000));
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = repository.top({ offset: 0, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(new Bignum(3000));
            expect(rows[1].balance).toEqual(new Bignum(2000));
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = repository.top({ limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(new Bignum(3000));
            expect(rows[1].balance).toEqual(new Bignum(2000));
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = repository.top({ offset: 1 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(new Bignum(2000));
            expect(rows[1].balance).toEqual(new Bignum(1000));
        });

        it("should be ok with legacy", () => {
            const { count, rows } = repository.top({}, true);

            expect(count).toBe(3);
            expect(rows.length).toBe(3);
            expect(rows[0].balance).toEqual(new Bignum(3000));
            expect(rows[1].balance).toEqual(new Bignum(2000));
            expect(rows[2].balance).toEqual(new Bignum(1000));
        });
    });

    describe("search", () => {
        const expectSearch = (params, rows = 1, count = 1) => {
            const wallets = repository.search(params);
            expect(wallets).toBeObject();

            expect(wallets).toHaveProperty("count");
            expect(wallets.count).toBeNumber();
            expect(wallets.count).toBe(count);

            expect(wallets).toHaveProperty("rows");
            expect(wallets.rows).toBeArray();
            expect(wallets.rows).not.toBeEmpty();

            expect(wallets.count).toBe(rows);
        };

        it("should search wallets by the specified address", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ address: wallets[0].address });
        });

        it("should search wallets by several addresses", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];
            expectSearch({ addresses }, 3, 3);
        });

        describe("when searching by `address` and `addresses`", () => {
            it("should search wallets only by `address`", () => {
                const wallets = generateFullWallets();
                walletManager.index(wallets);

                const { address } = wallets[0];
                const addresses = [wallets[1].address, wallets[3].address, wallets[9].address];
                expectSearch({ address, addresses }, 1, 1);
            });
        });

        it("should search wallets by the specified publicKey", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ publicKey: wallets[0].publicKey });
        });

        it("should search wallets by the specified secondPublicKey", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ secondPublicKey: wallets[0].secondPublicKey });
        });

        it("should search wallets by the specified vote", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ vote: wallets[0].vote });
        });

        it("should search wallets by the specified username", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ username: wallets[0].username });
        });

        it("should search wallets by the specified closed inverval (included) of balance", () => {
            const wallets = generateFullWallets();
            wallets.forEach((wallet, i) => {
                if (i < 13) {
                    wallet.balance = 53;
                } else if (i < 36) {
                    wallet.balance = 99;
                }
            });
            walletManager.index(wallets);

            expectSearch(
                {
                    balance: {
                        from: 53,
                        to: 99,
                    },
                },
                36,
                36,
            );
        });

        it("should search wallets by the specified closed interval (included) of voteBalance", () => {
            const wallets = generateFullWallets();
            wallets.forEach((wallet, i) => {
                if (i < 17) {
                    wallet.voteBalance = 12;
                } else if (i < 29) {
                    wallet.voteBalance = 17;
                }
            });
            walletManager.index(wallets);

            expectSearch(
                {
                    voteBalance: {
                        from: 11,
                        to: 18,
                    },
                },
                29,
                29,
            );
        });
    });
});
