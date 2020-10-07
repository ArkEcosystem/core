import "@packages/core-test-framework/src/matchers";

import { Repositories } from "@arkecosystem/core-database";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers } from "@arkecosystem/crypto";
import { ApiHelpers, Factories } from "@packages/core-test-framework/src";

import { calculateRanks, setUp, tearDown } from "../__support__/setup";

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

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    await calculateRanks();
});

afterAll(async () => await tearDown());

beforeEach(() => {
    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const wallet: Contracts.State.Wallet = walletRepository.findByUsername("genesis_10");
    wallet.setAttribute("delegate.forgedFees", AppUtils.BigNumber.make(delegate.forgedFees));
    wallet.setAttribute("delegate.forgedRewards", AppUtils.BigNumber.make(delegate.forgedRewards));
    wallet.setAttribute("delegate.producedBlocks", 75);
    wallet.setAttribute("delegate.voteBalance", AppUtils.BigNumber.make(delegate.voteBalance));

    walletRepository.index(wallet);
});

describe("API 2.0 - Delegates", () => {
    describe("GET /delegates", () => {
        it("should GET all delegates", async () => {
            const response = await api.request("GET", `delegates`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(51);
        });

        it("should GET the delegates for the specified addresses", async () => {
            const address = ["APRiwbs17FdbaF8DYU9js2jChRehQc2e6P", "AReCSCQRssLGF4XyhTjxhQm6mBFAWTaDTz"];
            const response = await api.request("GET", `delegates`, { address });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data.map(d => d.address).sort()).toEqual(address.sort());
        });
    });

    describe("GET /delegates/:id/blocks", () => {
        it("should GET all blocks for a delegate by the given identifier", async () => {
            const block2: Interfaces.IBlock = Factories.factory("Block")
                .withOptions({
                    config: Managers.configManager.all(),
                })
                .make();

            // save a new block so that we can make the request with generatorPublicKey
            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .saveBlocks([block2]);

            const response = await api.request("GET", `delegates/${block2.data.generatorPublicKey}/blocks`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                api.expectBlock(elem);
            }

            await app
                .get<Repositories.BlockRepository>(Container.Identifiers.DatabaseBlockRepository)
                .deleteBlocks([block2.data]); // reset to genesis block
        });

        it("should fail to GET a delegate by the given identifier if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "delegates/fake_username/blocks"), 404);
        });
    });

    describe("GET /delegates/:id/voters", () => {
        it("should GET all voters (wallets) for a delegate by the given identifier", async () => {
            const response = await api.request("GET", `delegates/${delegate.publicKey}/voters`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                api.expectWallet(elem);
            }

            expect(response.data.data.sort((a, b) => a.balance > b.balance)).toEqual(response.data.data);
        });

        it("should GET all voters (wallets) for a delegate by the given identifier ordered by 'balance:asc'", async () => {
            const response = await api.request("GET", `delegates/${delegate.publicKey}/voters`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const elem of response.data.data) {
                api.expectWallet(elem);
            }

            expect(response.data.data.sort((a, b) => a.balance < b.balance)).toEqual(response.data.data);
        });

        it("should fail to GET a delegate by the given identifier if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "delegates/fake_username/voters"), 404);
        });
    });
});
