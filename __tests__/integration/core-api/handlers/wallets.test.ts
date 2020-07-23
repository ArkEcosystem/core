import "@packages/core-test-framework/src/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { ApiHelpers } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

const genesisBlock = Managers.configManager.get("genesisBlock");

const username = "genesis_1";
const publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
const balance = 300000000000000;

const publicKey2 = "02def27da9336e7fbf63131b8d7e5c9f45b296235db035f1f4242c507398f0f21d";

let address;
let address2;

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    address = Identities.Address.fromPublicKey(publicKey);
    address2 = Identities.Address.fromPublicKey(publicKey2);
});

afterAll(async () => await tearDown());

describe("API 2.0 - Wallets", () => {
    describe("GET /wallets", () => {
        it("should GET all the wallets", async () => {
            const response = await api.request("GET", "wallets");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(52);

            for (const wallet of response.data.data) {
                api.expectWallet(wallet);
            }
        });

        it("should GET all the wallets sorted by balance,asc", async () => {
            const response = await api.request("GET", "wallets", { orderBy: "balance:asc" });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(52);

            let prevBalance = Utils.BigNumber.make(response.data.data[0].balance);
            for (const wallet of response.data.data.slice(1)) {
                expect(prevBalance.isLessThanEqual(wallet.balance)).toBe(true);
                prevBalance = Utils.BigNumber.make(wallet.balance);
            }
        });

        it("should GET all the wallets sorted by balance,desc", async () => {
            const response = await api.request("GET", "wallets", { orderBy: "balance:desc" });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(52);

            let prevBalance = Utils.BigNumber.make(response.data.data[0].balance);
            for (const wallet of response.data.data.slice(1)) {
                expect(prevBalance.isGreaterThanEqual(wallet.balance)).toBe(true);
                prevBalance = Utils.BigNumber.make(wallet.balance);
            }
        });
    });

    describe("GET /wallets/top", () => {
        it("should GET all the top wallets", async () => {
            const response = await api.request("GET", "wallets/top");

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.length).toBe(52);

            let prevBalance = Utils.BigNumber.make(response.data.data[0].balance);
            for (const wallet of response.data.data.slice(1)) {
                expect(prevBalance.isGreaterThanEqual(wallet.balance)).toBe(true);
                prevBalance = Utils.BigNumber.make(wallet.balance);
            }
        });
    });

    describe("GET /wallets/:id", () => {
        it("should GET wallet by address", async () => {
            const response = await api.request("GET", `wallets/${address}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data.address).toBe(address);
            expect(response.data.data.publicKey).toBe(publicKey);
            expect(response.data.data.attributes.delegate.username).toBe(username);
        });

        it("should GET wallet by publicKey", async () => {
            const response = await api.request("GET", `wallets/${publicKey}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data.address).toBe(address);
            expect(response.data.data.publicKey).toBe(publicKey);
            expect(response.data.data.attributes.delegate.username).toBe(username);
        });

        it("should GET wallet by publicKey", async () => {
            const response = await api.request("GET", `wallets/${username}`);

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data.address).toBe(address);
            expect(response.data.data.publicKey).toBe(publicKey);
            expect(response.data.data.attributes.delegate.username).toBe(username);
        });

        describe("when requesting an unknown address", () => {
            it("should return ResourceNotFound error", async () => {
                try {
                    await api.request("GET", "wallets/dummy");
                } catch (error) {
                    expect(error.response.status).toEqual(404);
                }
            });
        });
    });

    describe("GET /wallets/:id/transactions", () => {
        it("should GET all the transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            api.expectTransaction(response.data.data[0]);
        });
    });

    describe("GET /wallets/:id/transactions/sent", () => {
        it("should GET all the send transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions/sent`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            const transaction = response.data.data[0];
            api.expectTransaction(transaction);
            expect(transaction.sender).toBe(address);
        });

        it("should fail to GET all the sent transactions for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/transactions/sent"), 404);
        });
    });

    describe("GET /wallets/:id/transactions/received", () => {
        it("should GET all the received transactions for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/transactions/received`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            api.expectTransaction(response.data.data[0]);
        });

        it("should fail to GET all the received transactions for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/transactions/received"), 404);
        });
    });

    describe("GET /wallets/:id/votes", () => {
        it("should GET all the votes for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${address}/votes`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0]).toBeObject();
        });

        it("should fail to GET all the votes for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/votes"), 404);
        });
    });

    describe("GET /wallets/:id/locks", () => {
        let walletRepository: Contracts.State.WalletRepository;
        let wallets;
        let lockIds;

        beforeAll(() => {
            walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );

            wallets = [
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("1")),
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("2")),
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("3")),
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("4")),
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("5")),
                walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("6")),
            ];

            lockIds = [];

            for (let i = 0; i < wallets.length; i++) {
                const wallet = wallets[i];
                const transactions = genesisBlock.transactions.slice(i * 10, i * 10 + i + 1);

                const locks = {};
                for (let j = 0; j < transactions.length; j++) {
                    const transaction = transactions[j];
                    lockIds.push(transaction.id);

                    locks[transaction.id] = {
                        amount: Utils.BigNumber.make(10 * (j + 1)),
                        recipientId: wallet.address,
                        secretHash: transaction.id,
                        expiration: {
                            type: j % 2 === 0 ? 1 : 2,
                            value: 100 * (j + 1),
                        },
                        timestamp: 0,
                    };
                }

                wallet.setAttribute("htlc.locks", locks);
            }

            walletRepository.index(wallets);
        });

        it("should GET all locks for the given wallet by id", async () => {
            const response = await api.request("GET", `wallets/${wallets[0].address}/locks`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            api.expectLock(response.data.data[0]);
        });

        it("should fail to GET locks for the given wallet if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "wallets/fake_address/locks"), 404);
        });

        it("should GET all locks for the given wallet in the given order", async () => {
            const response = await api.request("GET", `wallets/${wallets[5].address}/locks`, {
                orderBy: "amount:desc",
            });

            for (let i = 0; i < response.data.data.length - 1; i++) {
                const lockA = response.data.data[i];
                const lockB = response.data.data[i + 1];

                expect(Utils.BigNumber.make(lockA.amount).isGreaterThanEqual(lockB.amount)).toBeTrue();
            }
        });
    });

    describe("POST /wallets/search", () => {
        it("should POST a search for wallets with the exact specified address", async () => {
            const response = await api.request("POST", "wallets/search", {
                address,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the any of the specified addresses", async () => {
            const response = await api.request("POST", "wallets/search", {
                address: [address, address2],
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);

            for (const wallet of response.data.data) {
                api.expectWallet(wallet);
            }

            expect(response.data.data.find((wallet) => wallet.address === address)).not.toBe(undefined);
            expect(response.data.data.find((wallet) => wallet.address === address2)).not.toBe(undefined);
        });

        it("should POST a search for wallets with the exact specified publicKey", async () => {
            const response = await api.request("POST", "wallets/search", {
                address,
                publicKey,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(wallet.publicKey).toBe(publicKey);
        });

        it("should POST a search for wallets with the exact specified secondPublicKey", async () => {
            const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );
            walletRepository.findOneByCriteria({ address }).setAttribute("secondPublicKey", publicKey2);

            const response = await api.request("POST", "wallets/search", {
                address,
                attributes: { secondPublicKey: publicKey2 },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(wallet.attributes.secondPublicKey).toBe(publicKey2);
        });

        // it("should POST a search for wallets with the exact specified vote", async () => {
        //     const response = await api.request("POST", "wallets/search", { address: address, vote });
        //     expect(response).toBeSuccessfulResponse();
        //     expect(response.data.data).toBeArray();

        //     expect(response.data.data).toHaveLength(1);

        //     const wallet = response.data.data[0];
        //     api.expectWallet(wallet);
        //     expect(wallet.address).toBe(address);
        // });

        it("should POST a search for wallets with the exact specified username", async () => {
            const response = await api.request("POST", "wallets/search", {
                attributes: { delegate: { username } },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the exact specified balance", async () => {
            const response = await api.request("POST", "wallets/search", {
                address,
                balance: { from: balance, to: balance },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(+wallet.balance).toBe(balance);
        });

        it("should POST a search for wallets with the specified balance range", async () => {
            const response = await api.request("POST", "wallets/search", {
                address,
                balance: { from: balance - 1000, to: balance + 1000 },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
            expect(+wallet.balance).toBe(balance);
        });

        it("should POST a search for wallets with the exact specified voteBalance", async () => {
            const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
                Container.Identifiers.WalletRepository,
                "state",
                "blockchain",
            );

            // Make sure all vote balances are at 0
            const delegates = walletRepository.allByUsername();
            for (let i = 0; i < delegates.length; i++) {
                const delegate = delegates[i];
                delegate.setAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);
                walletRepository.index(delegate);
            }

            // Give 2 delegates a vote weight
            const delegate1 = walletRepository.findByUsername("genesis_1");
            delegate1.setAttribute("delegate.voteBalance", Utils.BigNumber.make(balance));
            walletRepository.index(delegate1);

            const response = await api.request("POST", "wallets/search", {
                address,
                attributes: {
                    delegate: {
                        voteBalance: { from: balance, to: balance },
                    },
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });

        it("should POST a search for wallets with the wrong specified username", async () => {
            const response = await api.request("POST", "wallets/search", {
                address,
                attributes: { delegate: { username: "dummy" } },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(0);
        });

        it("should POST a search for wallets with the specific criteria", async () => {
            const response = await api.request("POST", "wallets/search", {
                publicKey,
                attributes: { delegate: { username } },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            const wallet = response.data.data[0];
            api.expectWallet(wallet);
            expect(wallet.address).toBe(address);
        });
    });
});
