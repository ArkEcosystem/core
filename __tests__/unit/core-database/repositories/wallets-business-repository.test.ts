import "jest-extended";
import "../mocks/core-container";

import { Database, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import compact from "lodash.compact";
import uniq from "lodash.uniq";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";

import { WalletsBusinessRepository } from "../../../../packages/core-database/src";
import { DatabaseService } from "../../../../packages/core-database/src/database-service";
import { Wallets } from "../../../../packages/core-state/src";
import { Address } from "../../../../packages/crypto/src/identities";
import { stateStorageStub } from "../__fixtures__/state-storage-stub";

let genesisSenders;
let repository: Database.IWalletsBusinessRepository;
let walletManager: State.IWalletManager;
let databaseService: Database.IDatabaseService;

beforeAll(() => {
    genesisSenders = uniq(compact(genesisBlock.transactions.map(tx => tx.data.senderPublicKey)));
});

beforeEach(async () => {
    walletManager = new Wallets.WalletManager();

    repository = new WalletsBusinessRepository(() => databaseService);

    databaseService = new DatabaseService(undefined, undefined, walletManager, repository, undefined, undefined);
});

const generateWallets = (): State.IWallet[] => {
    return genesisSenders.map((senderPublicKey, index) =>
        Object.assign(new Wallets.Wallet(Address.fromPublicKey(senderPublicKey)), {
            balance: Utils.BigNumber.make(index),
        }),
    );
};

const generateVotes = (): State.IWallet[] => {
    return genesisSenders.map(senderPublicKey =>
        Object.assign(new Wallets.Wallet(Address.fromPublicKey(senderPublicKey)), {
            attributes: { vote: genesisBlock.transactions[0].data.senderPublicKey },
        }),
    );
};

const generateFullWallets = (): State.IWallet[] => {
    return genesisSenders.map(senderPublicKey => {
        const address = Address.fromPublicKey(senderPublicKey);

        return Object.assign(new Wallets.Wallet(address), {
            publicKey: `publicKey-${address}`,
            attributes: {
                secondPublicKey: `secondPublicKey-${address}`,
                delegate: {
                    username: `username-${address}`,
                    balance: Utils.BigNumber.make(100),
                    voteBalance: Utils.BigNumber.make(200),
                },
                vote: `vote-${address}`,
            },
        });
    });
};

const generateHtlcLocks = (): State.IWallet[] => {
    return genesisBlock.transactions.map((transaction, i) =>
        Object.assign(new Wallets.Wallet(Address.fromPublicKey(transaction.data.senderPublicKey)), {
            attributes: {
                htlc: {
                    locks: {
                        [transaction.id]: {
                            amount: Utils.BigNumber.make(10),
                            recipientId: transaction.data.recipientId,
                            secretHash: transaction.id,
                            expiration: {
                                type: 1,
                                value: 100 * (i + 1),
                            },
                        },
                    },
                },
            },
        }),
    );
};

describe("Wallet Repository", () => {
    const searchRepository = (params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> => {
        return repository.search(Database.SearchScope.Wallets, params);
    };

    describe("search", () => {
        const expectSearch = (params, rows = 1, count = 1) => {
            const wallets = searchRepository(params);
            expect(wallets).toBeObject();

            expect(wallets).toHaveProperty("count");
            expect(wallets.count).toBeNumber();
            expect(wallets.count).toBe(count);

            expect(wallets).toHaveProperty("rows");
            expect(wallets.rows).toBeArray();
            expect(wallets.rows).not.toBeEmpty();

            expect(wallets.count).toBe(rows);
        };

        it("should return the local wallets of the connection", () => {
            jest.spyOn(walletManager, "allByAddress").mockReturnValue([]);

            searchRepository();

            expect(walletManager.allByAddress).toHaveBeenCalled();
        });

        it("should be ok without params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = searchRepository({});
            expect(count).toBe(52);
            expect(rows).toHaveLength(52);
        });

        it("should be ok with params", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = searchRepository({ offset: 10, limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (no offset)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = searchRepository({ limit: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = searchRepository({ offset: 0, limit: 12 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(12);
        });

        it("should be ok with params (no limit)", () => {
            const wallets = generateWallets();
            walletManager.index(wallets);

            const { count, rows } = searchRepository({ offset: 10 });
            expect(count).toBe(52);
            expect(rows).toHaveLength(42);
        });

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

            expectSearch({ secondPublicKey: wallets[0].getAttribute("secondPublicKey") });
        });

        it("should search wallets by the specified vote", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ vote: wallets[0].getAttribute("vote") });
        });

        it("should search wallets by the specified username", () => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            expectSearch({ username: wallets[0].getAttribute("delegate.username") });
        });

        it("should search wallets by the specified closed inverval (included) of balance", () => {
            const wallets = generateFullWallets();
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 13) {
                    wallet.balance = Utils.BigNumber.make(53);
                } else if (i < 36) {
                    wallet.balance = Utils.BigNumber.make(99);
                }
            }
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
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 17) {
                    wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(12));
                } else if (i < 29) {
                    wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(17));
                }
            }
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

        it("should return all locks", () => {
            const wallets = generateHtlcLocks();
            walletManager.index(wallets);

            jest.spyOn(stateStorageStub, "getLastBlock").mockReturnValue(genesisBlock);

            const locks = repository.search(Database.SearchScope.Locks, {});
            expect(locks.rows).toHaveLength(genesisBlock.transactions.length);
        });
    });

    describe("findAllByVote", () => {
        const vote = "dummy-sender-public-key";

        const findAllByVote = (
            vote: string,
            params: Database.IParameters = {},
        ): Database.IRowsPaginated<State.IWallet> => {
            return searchRepository({ ...params, ...{ vote } });
        };

        beforeEach(() => {
            const wallets = generateVotes();
            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                if (i < 17) {
                    wallet.setAttribute("vote", vote);
                }

                wallet.balance = Utils.BigNumber.make(0);
            }
            walletManager.index(wallets);
        });

        it("should be ok without params", () => {
            const { count, rows } = findAllByVote(vote);
            expect(count).toBe(17);
            expect(rows).toHaveLength(17);
        });

        it("should be ok with params", () => {
            const { count, rows } = findAllByVote(vote, {
                offset: 10,
                limit: 10,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(7);
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = findAllByVote(vote, { limit: 10 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(10);
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = findAllByVote(vote, {
                offset: 0,
                limit: 1,
            });
            expect(count).toBe(17);
            expect(rows).toHaveLength(1);
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = findAllByVote(vote, { offset: 30 });
            expect(count).toBe(17);
            expect(rows).toHaveLength(0);
        });
    });

    describe("findById", () => {
        const expectWallet = key => {
            const wallets = generateFullWallets();
            walletManager.index(wallets);

            const id: string = key === "username" ? wallets[0].getAttribute("delegate.username") : wallets[0][key];
            const wallet: State.IWallet = repository.findById(Database.SearchScope.Wallets, id);
            expect(wallet).toBeObject();
            expect(wallet.address).toBe(wallets[0].address);
            expect(wallet.publicKey).toBe(wallets[0].publicKey);
            expect(wallet.getAttribute("delegate.username")).toBe(wallets[0].getAttribute("delegate.username"));
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

            expect(repository.count(Database.SearchScope.Wallets)).toBe(52);
        });
    });

    describe("top", () => {
        const top = (params: Database.IParameters = {}): Database.IRowsPaginated<State.IWallet> => {
            return repository.top(Database.SearchScope.Wallets, params);
        };

        beforeEach(() => {
            for (const o of [
                { address: "dummy-1", balance: Utils.BigNumber.make(1000) },
                { address: "dummy-2", balance: Utils.BigNumber.make(2000) },
                { address: "dummy-3", balance: Utils.BigNumber.make(3000) },
            ]) {
                const wallet = new Wallets.Wallet(o.address);
                wallet.balance = o.balance;
                walletManager.reindex(wallet);
            }
        });

        it("should be ok without params", () => {
            const { count, rows } = top();

            expect(count).toBe(3);
            expect(rows.length).toBe(3);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[2].balance).toEqual(Utils.BigNumber.make(1000));
        });

        it("should be ok with params", () => {
            const { count, rows } = top({ offset: 1, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(1000));
        });

        it("should be ok with params (offset = 0)", () => {
            const { count, rows } = top({ offset: 0, limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
        });

        it("should be ok with params (no offset)", () => {
            const { count, rows } = top({ limit: 2 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(3000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(2000));
        });

        it("should be ok with params (no limit)", () => {
            const { count, rows } = top({ offset: 1 });

            expect(count).toBe(3);
            expect(rows.length).toBe(2);
            expect(rows[0].balance).toEqual(Utils.BigNumber.make(2000));
            expect(rows[1].balance).toEqual(Utils.BigNumber.make(1000));
        });
    });
});
