import { Application } from "@arkecosystem/core-kernel";
import { ApiInjectClient } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

import { setUp, tearDown } from "./__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("/wallets", () => {
    it("should return wallets sorted by balance:desc when orderBy parameter is empty string", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/wallets?orderBy=");

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
