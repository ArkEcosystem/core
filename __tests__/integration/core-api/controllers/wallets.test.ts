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

describe("general parameters", () => {
    describe("/wallets", () => {
        it("should return 422 when orderBy has invalid property", async () => {
            const client = app.resolve(ApiInjectClient);
            const response = await client.get("/wallets?orderBy=invalid");

            expect(response).toMatchObject({
                status: 422,
                body: {
                    message: `Unknown orderBy property 'invalid'`,
                },
            });
        });

        it("should return 422 when orderBy has invalid direction", async () => {
            const client = app.resolve(ApiInjectClient);
            const response = await client.get("/wallets?orderBy=balance:invalid-direction");

            expect(response).toMatchObject({
                status: 422,
                body: {
                    message: `Unexpected orderBy direction 'invalid-direction' for property 'balance'`,
                },
            });
        });
    });
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
