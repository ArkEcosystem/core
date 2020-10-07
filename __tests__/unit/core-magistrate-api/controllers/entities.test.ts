import { Container, Contracts } from "@arkecosystem/core-kernel";
import { EntitySearchService, Resources } from "@arkecosystem/core-magistrate-api";
import { EntityController } from "@arkecosystem/core-magistrate-api/src/controllers/entities";
import { Identifiers } from "@arkecosystem/core-magistrate-api/src/identifiers";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { Boom } from "@hapi/boom";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

const entitySearchService = {
    getEntity: jestfn<EntitySearchService["getEntity"]>(),
    getEntitiesPage: jestfn<EntitySearchService["getEntitiesPage"]>(),
};

const container = new Container.Container();
container.bind(Container.Identifiers.Application).toConstantValue(null);
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(null);
container.bind(Identifiers.EntitySearchService).toConstantValue(entitySearchService);

beforeEach(() => {
    jest.resetAllMocks();
});

const entityResource1 = {
    id: "52747ab6ab1353dd162ca1f7a7cc9ab1cad5ec75a991cf2c6fefc1a7776aa340",
    address: "AXzxJ8Ts3dQ2bvBR1tPE7GUee9iSEJb8HX",
    publicKey: "03da05c1c1d4f9c6bda13695b2f29fbc65d9589edc070fc61fe97974be3e59c14e",
    isResigned: false,
    type: Enums.EntityType.Business,
    subType: 0,
    data: {
        name: "Stub entity",
        ipfsData: "02f83268bda7ba236a2fb953f970b396fc5f274cc09d0c5b7d28db5a8c3559c1",
    },
};

describe("EntityController.index", () => {
    it("should get criteria from query and return page from EntitySearchService", () => {
        const entitiesPage: Contracts.Search.ResultsPage<Resources.EntityResource> = {
            results: [entityResource1],
            totalCount: 1,
            meta: { totalCountIsEstimate: false },
        };

        entitySearchService.getEntitiesPage.mockReturnValueOnce(entitiesPage);

        const entityController = container.resolve(EntityController);
        const result = entityController.index({
            query: {
                type: Enums.EntityType.Business,
                page: 1,
                limit: 100,
                orderBy: ["data.name", "address"],
            },
        });

        expect(entitySearchService.getEntitiesPage).toBeCalledWith(
            { offset: 0, limit: 100 },
            ["data.name", "address"],
            { type: Enums.EntityType.Business },
        );

        expect(result).toBe(entitiesPage);
    });
});

describe("EntityController.show", () => {
    it("should get entity id from path and return entity from EntitySearchService", () => {
        entitySearchService.getEntity.mockReturnValueOnce(entityResource1);

        const entityController = container.resolve(EntityController);
        const result = entityController.show({
            params: {
                id: entityResource1.id,
            },
        });

        expect(entitySearchService.getEntity).toBeCalledWith(entityResource1.id);
        expect(result).toEqual({ data: entityResource1 });
    });

    it("should return 404 when entity wasn't found", () => {
        entitySearchService.getEntity.mockReturnValueOnce(undefined);

        const entityController = container.resolve(EntityController);
        const result = entityController.show({
            params: {
                id: entityResource1.id,
            },
        });

        expect(entitySearchService.getEntity).toBeCalledWith(entityResource1.id);
        expect(result).toBeInstanceOf(Boom);
    });
});
