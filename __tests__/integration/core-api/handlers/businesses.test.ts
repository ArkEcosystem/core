import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const publicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Businesses", () => {
    let walletManager: State.IWalletManager;
    const businessAttribute = {
        businessAsset: {
            name: "bizzz",
            website: "biz.com",
            bridgechains: {
                "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935": {
                    bridgechainAsset: {
                        name: "arkecosystem1",
                        seedNodes: [
                            "74.125.224.71",
                            "74.125.224.72",
                            "64.233.173.193",
                            "2001:4860:4860::8888",
                            "2001:4860:4860::8844",
                        ],
                        genesisHash: "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935",
                        bridgechainRepository: "http://www.repository.com/myorg/myrepo",
                        ports: { "@arkecosystem/core-api": 4003 },
                    },
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

    describe("GET /businesses", () => {
        it("should GET all businesses", async () => {
            const response = await utils.request("GET", `businesses`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.data[0].publicKey).toBe(publicKey);
            expect(response.data.data[0].name).toEqual(businessAttribute.businessAsset.name);
            expect(response.data.data[0].website).toEqual(businessAttribute.businessAsset.website);
        });
    });

    describe("GET /businesses/:id", () => {
        it("should GET business by id (wallet publicKey)", async () => {
            const response = await utils.request("GET", `businesses/${publicKey}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data.attributes.business).toEqual(businessAttribute);
        });
    });

    describe("GET /businesses/:id/bridgechains", () => {
        it("should GET business bridgechains", async () => {
            const response = await utils.request("GET", `businesses/${publicKey}/bridgechains`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            // TODO check bridgechainId is correct (after bridgechainId = genesisHash PR is merged)
        });
    });

    describe("POST /businesses/search", () => {
        it("should POST a search for businesses by name", async () => {
            const response = await utils.request("POST", "businesses/search", {
                name: businessAttribute.businessAsset.name,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.data[0].publicKey).toBe(publicKey);
            expect(response.data.data[0].name).toEqual(businessAttribute.businessAsset.name);
            expect(response.data.data[0].website).toEqual(businessAttribute.businessAsset.website);
        });

        it("should POST a search for businesses by isResigned", async () => {
            const response = await utils.request("POST", "businesses/search", {
                isResigned: false,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const business of response.data.data) {
                expect(business.isResigned).toBeFalse();
            }
        });
    });
});
