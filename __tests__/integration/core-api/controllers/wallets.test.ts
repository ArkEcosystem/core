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

describe("/wallets/search", () => {
    it("should return 3 wallets with delegate username genesis_1 or genesis_2 or genesis_3", async () => {
        const client = app.resolve(ApiHttpClient);
        const query = {
            orderBy: "attributes.delegate.username",
        };
        const payload = {
            attributes: {
                delegate: {
                    username: ["genesis_1", "genesis_2", "genesis_3"],
                },
            },
        };
        const response = await client.post("/wallets/search", payload, query);
        const wallets = response.data.data;

        expect(wallets.length).toBe(3);
        expect(wallets[0].attributes.delegate.username).toBe("genesis_1");
        expect(wallets[1].attributes.delegate.username).toBe("genesis_2");
        expect(wallets[2].attributes.delegate.username).toBe("genesis_3");
    });

    it("should return 5 wallets with delegate rank between 1 and 2, or 10 and 12", async () => {
        const client = app.resolve(ApiHttpClient);
        const query = {
            orderBy: "attributes.delegate.rank",
        };
        const payload = {
            attributes: {
                delegate: {
                    rank: [
                        { from: 1, to: 2 },
                        { from: 10, to: 12 },
                    ],
                },
            },
        };
        const response = await client.post("/wallets/search", payload, query);
        const wallets = response.data.data;

        expect(wallets.length).toBe(5);
        expect(wallets[0].attributes.delegate.rank).toBe(1);
        expect(wallets[1].attributes.delegate.rank).toBe(2);
        expect(wallets[2].attributes.delegate.rank).toBe(10);
        expect(wallets[3].attributes.delegate.rank).toBe(11);
        expect(wallets[4].attributes.delegate.rank).toBe(12);
    });
});
