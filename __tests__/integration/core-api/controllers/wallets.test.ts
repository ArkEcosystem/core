import { Application } from "@arkecosystem/core-kernel";
import { ApiInjectClient } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("/wallets", () => {
    it("should return wallets sorted by balance:desc", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallets");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;
        let prevBalance = Utils.BigNumber.make(wallets[0].balance);
        for (const wallet of wallets.slice(1)) {
            const walletBalance = Utils.BigNumber.make(wallet.balance);
            expect(walletBalance.isLessThanEqual(prevBalance)).toBe(true);
            prevBalance = walletBalance;
        }
    });

    it("should return wallets with balance less than 200000000000000", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallets?balance.to=200000000000000");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;

        expect(wallets.length).toBe(1);
        expect(wallets[0].balance).toBe("-15300000000000000");
        expect(wallets[0].nonce).toBe("51");
    });

    it("should return 3 wallets when using offset parameter", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallets?orderBy=attributes.delegate.rank&limit=3&offset=2");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;

        expect(wallets.length).toBe(3);
        expect(wallets[0].attributes.delegate.rank).toBe(3);
        expect(wallets[1].attributes.delegate.rank).toBe(4);
        expect(wallets[2].attributes.delegate.rank).toBe(5);
    });

    it("should return 3 wallets when using page parameter", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallets?orderBy=attributes.delegate.rank&limit=3&page=2");

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;

        expect(wallets.length).toBe(3);
        expect(wallets[0].attributes.delegate.rank).toBe(4);
        expect(wallets[1].attributes.delegate.rank).toBe(5);
        expect(wallets[2].attributes.delegate.rank).toBe(6);
    });
});

describe("/wallets/:id", () => {
    it("should respond with 404 error when loading wallet that does not exist", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallet/no-such-wallet-id");

        expect(response).toMatchObject({
            status: 404,
            body: {
                error: "Not Found",
                // message: "Wallet not found",
            },
        });
    });
});

describe("/wallets/search", () => {
    it("should return 3 wallets with delegate username genesis_1 or genesis_2 or genesis_3", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.post("/wallets/search?orderBy=attributes.delegate.username", {
            attributes: {
                delegate: {
                    username: ["genesis_1", "genesis_2", "genesis_3"],
                },
            },
        });

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;

        expect(wallets.length).toBe(3);
        expect(wallets[0].attributes.delegate.username).toBe("genesis_1");
        expect(wallets[1].attributes.delegate.username).toBe("genesis_2");
        expect(wallets[2].attributes.delegate.username).toBe("genesis_3");
    });

    it("should return 5 wallets with delegate rank between 1 and 2, or 10 and 12", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.post("/wallets/search?orderBy=attributes.delegate.rank", {
            attributes: {
                delegate: {
                    rank: [
                        { from: 1, to: 2 },
                        { from: 10, to: 12 },
                    ],
                },
            },
        });

        expect(response).toMatchObject({
            status: 200,
            body: {
                data: expect.toBeArray(),
            },
        });

        const wallets = response.body.data;

        expect(wallets.length).toBe(5);
        expect(wallets[0].attributes.delegate.rank).toBe(1);
        expect(wallets[1].attributes.delegate.rank).toBe(2);
        expect(wallets[2].attributes.delegate.rank).toBe(10);
        expect(wallets[3].attributes.delegate.rank).toBe(11);
        expect(wallets[4].attributes.delegate.rank).toBe(12);
    });
});
