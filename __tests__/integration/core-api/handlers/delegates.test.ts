import "../../../utils";

import { calculateRanks, setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

import { blocks2to100 } from "../../../utils/fixtures/testnet/blocks2to100";

import { Blocks, Utils } from "@arkecosystem/crypto";
const { BlockFactory } = Blocks;

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";

const delegate = {
    address: "AFyf2qVpX2JbpKcy29XbusedCpFDeYFX8Q",
    publicKey: "02f7acb179ddfddb2e220aa600921574646ac59fd3f1ae6255ada40b9a7fab75fd",
    username: "genesis_10",
    forgedFees: 50,
    forgedRewards: 50,
    forgedTotal: 100,
    producedBlocks: 75,
    voteBalance: 100000,
};

const delegate2 = {
    username: "genesis_11",
};

beforeAll(async () => {
    await setUp();
    await calculateRanks();

    const wm: State.IWalletManager = app.resolvePlugin("database").walletManager;
    const wallet: State.IWallet = wm.findByUsername("genesis_10");

    wallet.setAttribute(
        "delegate",
        Object.assign(wallet.getAttribute("delegate"), {
            forgedFees: Utils.BigNumber.make(delegate.forgedFees),
            forgedRewards: Utils.BigNumber.make(delegate.forgedRewards),
            producedBlocks: 75,
            voteBalance: Utils.BigNumber.make(delegate.voteBalance),
        }),
    );

    wm.reindex(wallet);
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Delegates", () => {
    describe("GET /delegates", () => {
        it("should GET all the delegates", async () => {
            const response = await utils.request("GET", "delegates");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const delegate of response.data.data) {
                utils.expectDelegate(delegate);
            }

            expect(response.data.data.sort((a, b) => a.rank < b.rank)).toEqual(response.data.data);
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "delegates");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 51,
                first: "/delegates?page=1&limit=100",
                last: "/delegates?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/delegates?page=1&limit=100",
                totalCount: 51,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });

        it("should GET all the delegates sorted by votes,asc", async () => {
            const wm: State.IWalletManager = app.resolvePlugin("database").walletManager;
            const wallet: State.IWallet = wm.findByUsername("genesis_51");
            wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.ONE);
            wm.reindex(wallet);

            const response = await utils.request("GET", "delegates", { orderBy: "votes:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0].username).toBe(wallet.getAttribute<string>("delegate.username"));
            expect(response.data.data[0].votes).toBe(
                wallet.getAttribute<Utils.BigNumber>("delegate.voteBalance").toFixed(),
            );
        });

        it("should GET all the delegates sorted by votes,desc", async () => {
            const wm: State.IWalletManager = app.resolvePlugin("database").walletManager;
            const wallet: State.IWallet = wm.findByUsername("genesis_1");
            wallet.setAttribute("delegate.voteBalance", Utils.BigNumber.make(12500000000000000));
            wm.reindex(wallet);

            const response = await utils.request("GET", "delegates", { orderBy: "votes:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data[0].username).toBe(wallet.getAttribute("delegate.username"));
            expect(response.data.data[0].votes).toBe(
                wallet.getAttribute<Utils.BigNumber>("delegate.voteBalance").toFixed(),
            );
        });

        it("should GET all the delegates ordered by descending rank", async () => {
            const response = await utils.request("GET", "delegates", { orderBy: "rank:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const delegate of response.data.data) {
                utils.expectDelegate(delegate);
            }

            expect(response.data.data.sort((a, b) => a.rank > b.rank)).toEqual(response.data.data);
        });

        it("should GET all the delegates ordered by descending approval", async () => {
            const response = await utils.request("GET", "delegates", { orderBy: "approval:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const delegate of response.data.data) {
                utils.expectDelegate(delegate);
            }

            expect(response.data.data.sort((a, b) => a.production.approval > b.production.approval)).toEqual(
                response.data.data,
            );
        });
    });

    describe("GET /delegates/:id", () => {
        it("should GET a delegate by the given username", async () => {
            const response = await utils.request("GET", `delegates/${delegate.username}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            utils.expectDelegate(response.data.data);
            expect(response.data.data.username).toEqual(delegate.username);
        });

        it("should GET a delegate by the given address", async () => {
            const response = await utils.request("GET", `delegates/${delegate.address}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            utils.expectDelegate(response.data.data);
            expect(response.data.data.address).toEqual(delegate.address);
        });

        it("should GET a delegate by the given public key", async () => {
            const response = await utils.request("GET", `delegates/${delegate.publicKey}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            utils.expectDelegate(response.data.data);
            expect(response.data.data.publicKey).toEqual(delegate.publicKey);
        });

        it("should fail to GET a delegate by the given identifier if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "delegates/fake_username"), 404);
        });

        it("should fail to GET a delegate by the given identifier if the resource is not a delegate (has no username)", async () => {
            const wallet = new Wallets.Wallet("non_delegate_address");

            const wm = app.resolvePlugin("database").walletManager;
            wm.index([wallet]);

            utils.expectError(await utils.request("GET", `delegates/${wallet.address}`), 404);
        });
    });

    describe("POST /delegates/search", () => {
        it("should POST a search for delegates with an address that matches the given string", async () => {
            const response = await utils.request("POST", "delegates/search", {
                address: delegate.address,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(elem.address).toBe(delegate.address);
            }
        });

        it("should POST a search for delegates with a public key that matches the given string", async () => {
            const response = await utils.request("POST", "delegates/search", {
                publicKey: delegate.publicKey,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(elem.publicKey).toBe(delegate.publicKey);
            }
        });

        it("should POST a search for delegates with a username that matches the given string", async () => {
            const response = await utils.request("POST", "delegates/search", {
                username: delegate.username,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(elem.username).toEqual(delegate.username);
            }
        });

        it("should POST a search for delegates with any of the specified usernames", async () => {
            const usernames = [delegate.username, delegate2.username];

            const response = await utils.request("POST", "delegates/search", {
                usernames,
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(usernames.includes(elem.username)).toBe(true);
            }
        });

        it("should POST a search for delegates with the exact specified approval", async () => {
            const response = await utils.request("POST", "delegates/search", {
                approval: {
                    from: 0,
                    to: 0,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(elem.production.approval).toEqual(0);
            }
        });

        it("should POST a search for delegates with the specified approval range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                approval: {
                    from: 1,
                    to: 100,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(49);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.production.approval).toBeGreaterThanOrEqual(1);
                expect(+elem.production.approval).toBeLessThanOrEqual(100);
            }
        });

        it("should POST a search for delegates with the exact specified forged fees", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedFees: {
                    from: delegate.forgedFees,
                    to: delegate.forgedFees,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.fees).toEqual(delegate.forgedFees);
            }
        });

        it("should POST a search for delegates with the specified forged fees range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedFees: {
                    from: 0,
                    to: delegate.forgedFees,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.fees).toBeGreaterThanOrEqual(0);
                expect(+elem.forged.fees).toBeLessThanOrEqual(delegate.forgedFees);
            }
        });

        it("should POST a search for delegates with the exact specified forged rewards", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedRewards: {
                    from: delegate.forgedRewards,
                    to: delegate.forgedRewards,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.rewards).toEqual(delegate.forgedRewards);
            }
        });

        it("should POST a search for delegates with the specified forged rewards range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedRewards: {
                    from: 0,
                    to: delegate.forgedRewards,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.rewards).toBeGreaterThanOrEqual(0);
                expect(+elem.forged.rewards).toBeLessThanOrEqual(delegate.forgedRewards);
            }
        });

        it("should POST a search for delegates with the exact specified forged total", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedTotal: {
                    from: delegate.forgedTotal,
                    to: delegate.forgedTotal,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.total).toEqual(delegate.forgedTotal);
            }
        });

        it("should POST a search for delegates with the specified forged total range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                forgedRewards: {
                    from: 0,
                    to: delegate.forgedTotal,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.forged.total).toBeGreaterThanOrEqual(0);
                expect(+elem.forged.total).toBeLessThanOrEqual(delegate.forgedTotal);
            }
        });

        it("should POST a search for delegates with the exact specified produced blocks", async () => {
            const response = await utils.request("POST", "delegates/search", {
                producedBlocks: {
                    from: delegate.producedBlocks,
                    to: delegate.producedBlocks,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(elem.blocks.produced).toEqual(delegate.producedBlocks);
            }
        });

        it("should POST a search for delegates with the specified produced blocks range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                producedBlocks: {
                    from: 0,
                    to: delegate.producedBlocks,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.blocks.produced).toBeGreaterThanOrEqual(0);
                expect(+elem.blocks.produced).toBeLessThanOrEqual(delegate.producedBlocks);
            }
        });

        it("should POST a search for delegates with the exact specified vote balance", async () => {
            const response = await utils.request("POST", "delegates/search", {
                voteBalance: {
                    from: delegate.voteBalance,
                    to: delegate.voteBalance,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.votes).toEqual(delegate.voteBalance);
            }
        });

        it("should POST a search for delegates with the specified vote balance range", async () => {
            const response = await utils.request("POST", "delegates/search", {
                voteBalance: {
                    from: 0,
                    to: delegate.voteBalance,
                },
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(2);

            for (const elem of response.data.data) {
                utils.expectDelegate(elem);
                expect(+elem.votes).toBeGreaterThanOrEqual(0);
                expect(+elem.votes).toBeLessThanOrEqual(delegate.voteBalance);
            }
        });
    });

    describe("GET /delegates/:id/blocks", () => {
        it("should GET all blocks for a delegate by the given identifier", async () => {
            // save a new block so that we can make the request with generatorPublicKey
            const block2 = BlockFactory.fromData(blocks2to100[0]);
            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
            await databaseService.saveBlock(block2);

            const response = await utils.request("GET", `delegates/${blocks2to100[0].generatorPublicKey}/blocks`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                utils.expectBlock(elem);
            }

            await databaseService.deleteBlocks([block2.data]); // reset to genesis block
        });

        it("should fail to GET a delegate by the given identifier if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "delegates/fake_username/blocks"), 404);
        });
    });

    describe("GET /delegates/:id/voters", () => {
        it("should GET all voters (wallets) for a delegate by the given identifier", async () => {
            const response = await utils.request("GET", `delegates/${delegate.publicKey}/voters`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                utils.expectWallet(elem);
            }

            expect(response.data.data.sort((a, b) => a.balance > b.balance)).toEqual(response.data.data);
        });

        it("should GET all voters (wallets) for a delegate by the given identifier ordered by 'balance:asc'", async () => {
            const response = await utils.request("GET", `delegates/${delegate.publicKey}/voters`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                utils.expectWallet(elem);
            }

            expect(response.data.data.sort((a, b) => a.balance < b.balance)).toEqual(response.data.data);
        });

        it("should fail to GET a delegate by the given identifier if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "delegates/fake_username/voters"), 404);
        });
    });
});
