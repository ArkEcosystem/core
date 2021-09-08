import { EntitySearchService, Identifiers as MagistrateApiIdentifiers } from "@arkecosystem/core-magistrate-api/src";
import { Container, Contracts } from "@arkecosystem/core-kernel";

import { setUp } from "./__support__/setup";
import { setIndexes } from "../__support__/set-indexes";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Identities } from "@arkecosystem/crypto";

const entityId1 = "2a2498072a798318f5e321b312dfc7dcb87f33e10a251baf07ed8f950bd499ec";
const entityAttribute1 = {
    type: Enums.EntityType.Business,
    subType: 0,
    action: Enums.EntityAction.Register,
    data: { name: "entity 1" },
};

const entityId2 = "f8d86fb5b1ec46a8034818f01ccb52fb38dca148cdb938e203464317743c3d0b";
const entityAttribute2 = {
    type: Enums.EntityType.Business,
    subType: 0,
    action: Enums.EntityAction.Register,
    data: { name: "entity 2" },
};

let walletRepository: Contracts.State.WalletRepository;
let entitySearchService: EntitySearchService;

beforeEach(async () => {
    const app = await setUp();

    walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    entitySearchService = app.get<EntitySearchService>(MagistrateApiIdentifiers.EntitySearchService);
});

describe("EntitySearchService.getEntity", () => {
    it("should return entity", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("entities", { [entityId1]: entityAttribute1 });
        setIndexes(walletRepository, wallet1);

        const entityResource1 = entitySearchService.getEntity(entityId1);

        expect(entityResource1.id).toBe(entityId1);
        expect(entityResource1.data.name).toBe("entity 1");
    });

    it("should return undefined when entity wasn't found", () => {
        const entityResource = entitySearchService.getEntity("non existing entity id");
        expect(entityResource).toBe(undefined);
    });
});

describe("EntitySearchService.getEntitiesPage", () => {
    it("should return all entities", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("entities", { [entityId1]: entityAttribute1 });
        setIndexes(walletRepository, wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet2"));
        wallet2.setAttribute("entities", { [entityId2]: entityAttribute2 });
        setIndexes(walletRepository, wallet2);

        const entitiesPage = entitySearchService.getEntitiesPage({ offset: 0, limit: 100 }, []);

        expect(entitiesPage.totalCount).toBe(2);
        expect(entitiesPage.results[0].data.name).toBe("entity 1");
        expect(entitiesPage.results[1].data.name).toBe("entity 2");
    });

    it("should entities that match criteria", () => {
        const wallet1 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet1"));
        wallet1.setAttribute("entities", { [entityId1]: entityAttribute1 });
        setIndexes(walletRepository, wallet1);

        const wallet2 = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase("wallet2"));
        wallet2.setAttribute("entities", { [entityId2]: entityAttribute2 });
        setIndexes(walletRepository, wallet2);

        const entitiesPage = entitySearchService.getEntitiesPage({ offset: 0, limit: 100 }, [], {
            data: { name: "entity 1" },
        });

        expect(entitiesPage.totalCount).toBe(1);
        expect(entitiesPage.results[0].data.name).toBe("entity 1");
    });
});
