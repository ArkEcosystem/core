import { EntitySearchService, Identifiers as MagistrateApiIdentifiers } from "@arkecosystem/core-magistrate-api/src";
// import { Container, Contracts } from "@arkecosystem/core-kernel";

import { setUp } from "./__support__/setup";

// let walletRepository: Contracts.State.WalletRepository;
let entitySearchService: EntitySearchService;

beforeEach(async () => {
    const app = await setUp();

    // walletRepository = app.getTagged<Contracts.State.WalletRepository>(
    //     Container.Identifiers.WalletRepository,
    //     "state",
    //     "blockchain",
    // );

    entitySearchService = app.get<EntitySearchService>(MagistrateApiIdentifiers.EntitySearchService);
});

describe("EntitySearchService.getEntity", () => {
    it("should return undefined when entity wasn't found", () => {
        const entityResource = entitySearchService.getEntity("non existing entity id");
        expect(entityResource).toBe(undefined);
    });
});
