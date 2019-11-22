import "@packages/core-test-framework/src/matchers";

import { setUp, tearDown } from "../__support__/setup";
import { Contracts, Container } from "@arkecosystem/core-kernel";
import { ApiHelpers } from "@arkecosystem/core-test-framework";

const publicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);
});

afterAll(async () => await tearDown());

describe("API 2.0 - Businesses", () => {
    const businessAttribute = {
        businessAsset: {
            name: "bizzz",
            website: "biz.com",
            bridgechains: {
                "127e6fbfe24a750e72930c220a8e138275656b8e5d8f48a98c3c92df2caba935": {
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
                },
            },
        },
    };

    beforeEach(() => {
        const walletRepository: Contracts.State.WalletRepository = app.get<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
        );

        const wallet = walletRepository.findByPublicKey(publicKey);
        wallet.setAttribute("business", businessAttribute);
        wallet.setAttribute("business.bridgechains", businessAttribute.businessAsset.bridgechains);

        walletRepository.reindex(wallet);
    });

    describe("GET /businesses", () => {
        it("should GET all businesses", async () => {
            const response = await api.request("GET", `businesses`);
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
            const response = await api.request("GET", `businesses/${publicKey}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data.attributes.business).toEqual(businessAttribute);
        });
    });

    describe("GET /businesses/:id/bridgechains", () => {
        it("should GET business bridgechains", async () => {
            const response = await api.request("GET", `businesses/${publicKey}/bridgechains`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);
            // TODO check bridgechainId is correct (after bridgechainId = genesisHash PR is merged)
        });
    });

    describe("POST /businesses/search", () => {
        it("should POST a search for businesses by name", async () => {
            const response = await api.request("POST", "businesses/search", {
                name: businessAttribute.businessAsset.name,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.data[0].publicKey).toBe(publicKey);
            expect(response.data.data[0].name).toEqual(businessAttribute.businessAsset.name);
            expect(response.data.data[0].website).toEqual(businessAttribute.businessAsset.website);
        });
    });
});