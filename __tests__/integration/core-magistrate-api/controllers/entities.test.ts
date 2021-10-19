import { Application, Container, Contracts } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { ApiInjectClient } from "@arkecosystem/core-test-framework";
import { Managers } from "@arkecosystem/crypto";

import { setUp, tearDown } from "../__support__/setup";
import { setIndexes } from "../__support__/set-indexes";

let app: Application;

afterAll(async () => {
    await tearDown();
});

beforeAll(async () => {
    app = await setUp();

    const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const genesisBlock = Managers.configManager.get("genesisBlock");
    const wallets = walletRepository.allByPublicKey();

    let entityType = Enums.EntityType.Business;
    let entitySubType = 0;

    for (let i = 0; i < 10; i++) {
        const wallet = wallets[i];
        const id = genesisBlock.transactions[i].id;

        const walletEntity = {
            resigned: false,
            type: entityType,
            subType: entitySubType,
            data: {
                name: `entity ${entityType} ${entitySubType}`,
                ipfsData: "0".repeat(64),
            },
        };

        const walletEntities = {
            [id]: walletEntity,
        };

        wallet.setAttribute("entities", walletEntities);
        setIndexes(walletRepository, wallet);

        entityType = ++entityType % 4;
        entitySubType = ++entitySubType % 3;
    }

    expect(walletRepository).toBeTruthy();
});

describe("/entities", () => {
    it("should return entities sorted by data.name:asc", async () => {
        const client = app.resolve(ApiInjectClient);
        const response = await client.get("/entities");

        expect(response).toMatchObject({ status: 200 });

        const entities = response.body.data;
        let prevName = entities[0].data.name;
        for (const entity of entities.slice(1)) {
            expect(entity.data.name.localeCompare(prevName)).toBeGreaterThanOrEqual(0);
            prevName = entity.data.name;
        }
    });
});
