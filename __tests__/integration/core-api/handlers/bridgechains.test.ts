import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const publicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Bridgechains", () => {
    let walletManager: State.IWalletManager;
    const bridgechainAsset = {
        name: "arkecosystem1",
        seedNodes: ["74.125.224.71", "74.125.224.72", "64.233.173.193", "2001:4860:4860::8888", "2001:4860:4860::8844"],
        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
        ports: { "@arkecosystem/core-api": 4003 },
    };

    const businessAttribute = {
        businessAsset: {
            name: "bizzz",
            website: "biz.com",
            bridgechains: {
                "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935": {
                    bridgechainAsset,
                },
            },
        },
    };

    beforeAll(() => {
        walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

        const wallet = walletManager.findByPublicKey(publicKey);
        wallet.setAttribute("business", businessAttribute);
        wallet.setAttribute("business.bridgechains", businessAttribute.businessAsset.bridgechains);

        walletManager.reindex(wallet);
    });

    describe("GET /bridgechains", () => {
        it("should GET all bridgechains", async () => {
            const response = await utils.request("GET", `bridgechains`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.data[0].publicKey).toEqual(publicKey);
            expect(response.data.data[0].name).toEqual(bridgechainAsset.name);
            expect(response.data.data[0].seedNodes).toEqual(bridgechainAsset.seedNodes);
            expect(response.data.data[0].genesisHash).toEqual(bridgechainAsset.genesisHash);
            expect(response.data.data[0].bridgechainRepository).toEqual(bridgechainAsset.bridgechainRepository);
            expect(response.data.data[0].ports).toEqual(bridgechainAsset.ports);
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "bridgechains");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 1,
                first: "/bridgechains?page=1&limit=100",
                last: "/bridgechains?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/bridgechains?page=1&limit=100",
                totalCount: 1,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });
    });

    describe("POST /bridgechains/search", () => {
        it("should POST a search for bridgechains by name", async () => {
            const response = await utils.request("POST", "bridgechains/search", {
                name: bridgechainAsset.name,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.data[0].publicKey).toEqual(publicKey);
            expect(response.data.data[0].name).toEqual(bridgechainAsset.name);
            expect(response.data.data[0].seedNodes).toEqual(bridgechainAsset.seedNodes);
            expect(response.data.data[0].genesisHash).toEqual(bridgechainAsset.genesisHash);
            expect(response.data.data[0].bridgechainRepository).toEqual(bridgechainAsset.bridgechainRepository);
            expect(response.data.data[0].ports).toEqual(bridgechainAsset.ports);
        });

        it("should POST a search for bridgechains by isResigned", async () => {
            const response = await utils.request("POST", "bridgechains/search", {
                isResigned: false,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const bridgechain of response.data.data) {
                expect(bridgechain.isResigned).toBeFalse();
            }
        });
    });
});
