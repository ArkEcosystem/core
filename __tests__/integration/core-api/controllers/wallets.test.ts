import { Application } from "@arkecosystem/core-kernel";
import { ApiHttpClient } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

import { setUp, tearDown } from "../__support__/setup";

let app: Application;

beforeAll(async () => {
    app = await setUp();
});

afterAll(async () => await tearDown());

describe("/wallets", () => {
    it("should return wallets sorted by balance:desc", async () => {
        const client = app.resolve(ApiHttpClient);
        const response = await client.get("/wallets");
        const wallets = response.data.data;

        const prevBalance = Utils.BigNumber.make(wallets[0].balance);
        for (const wallet of wallets.slice(1)) {
            const walletBalance = Utils.BigNumber.make(wallet.balance);
            expect(walletBalance.isLessThanEqual(prevBalance)).toBe(true);
        }
    });

    it("should return wallets with balance less than 200000000000000", async () => {
        const client = app.resolve(ApiHttpClient);
        const response = await client.get("/wallets", { "balance.to": "200000000000000" });
        const wallets = response.data.data;

        expect(wallets.length).toBe(1);
        expect(wallets[0].balance).toBe("-15300000000000000");
        expect(wallets[0].nonce).toBe("51");
    });
});
