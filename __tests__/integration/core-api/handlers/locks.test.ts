import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Identities, Utils } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../utils/fixtures/testnet/block-model";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Locks", () => {
    let wallets;
    let lockIds;
    beforeAll(() => {
        const walletManager = app.resolvePlugin("database").walletManager;

        wallets = [
            walletManager.findByAddress(Identities.Address.fromPassphrase("1")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("2")),
            walletManager.findByAddress(Identities.Address.fromPassphrase("3")),
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
                    amount: Utils.BigNumber.make(10),
                    recipientId: wallet.address,
                    secretHash: transaction.id,
                    expiration: {
                        type: j % 2 === 0 ? 1 : 2,
                        value: 100 * (j + 1),
                    },
                };
            }

            wallet.setAttribute("htlc.locks", locks);
        }

        walletManager.index(wallets);
    });

    describe("GET /locks", () => {
        it("should GET all the locks", async () => {
            const response = await utils.request("GET", "locks");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            utils.expectLock(response.data.data[0]);
        });

        it("should GET all the locks sorted by expirationValue,asc", async () => {
            const response = await utils.request("GET", "locks", { orderBy: "expirationValue:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data[0].expirationValue).toBe(100);
        });

        it("should GET all the locks by epoch expiration", async () => {
            const response = await utils.request("GET", "locks", { expirationType: 1 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => lock.expirationType === 1)).toBeTrue();
        });

        it("should GET all the locks by height expiration", async () => {
            const response = await utils.request("GET", "locks", { expirationType: 2 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).not.toBeEmpty();
            expect(response.data.data.every(lock => lock.expirationType === 2)).toBeTrue();
        });
    });

    describe("GET /locks/:id", () => {
        it("should GET a wallet by the given identifier", async () => {
            const response = await utils.request("GET", `locks/${lockIds[0]}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            const lock = response.data.data;
            utils.expectLock(lock);
            expect(lock.lockId).toBe(lockIds[0]);
        });

        describe("when requesting an unknown lock", () => {
            it("should return ResourceNotFound error", async () => {
                try {
                    await utils.request("GET", "locks/dummy");
                } catch (error) {
                    expect(error.response.status).toEqual(404);
                }
            });
        });
    });

    describe("POST /locks/search", () => {
        it("should POST a search for locks with the exact specified lockId", async () => {
            const response = await utils.request("POST", "locks/search", {
                lockId: lockIds[0],
            });

            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            expect(response.data.data).toHaveLength(1);

            const lock = response.data.data[0];
            utils.expectLock(lock);
            expect(lock.lockId).toBe(lockIds[0]);
        });

        // TODO: more coverage
    });
});
