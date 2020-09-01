import "jest-extended";

import { EntitySubType, EntityType } from "@arkecosystem/core-magistrate-crypto/dist/enums";
import { EntityResource } from "@packages/core-magistrate-api/src/resources";

let resource: EntityResource;

const entity: any = {
    id: "id",
    address: "wallet_address",
    type: EntityType.Bridgechain,
    subType: EntitySubType.None,
    registrationId: "registration_id",
    data: {
        name: "dummy_name",
        ipfsData: "ipfs_data",
    },
};

beforeEach(() => {
    resource = new EntityResource();
});

describe("EntityResource", () => {
    describe("raw", () => {
        it("should return raw object", async () => {
            expect(resource.raw(entity)).toEqual(entity);
        });
    });

    describe("transform", () => {
        it("should return transformed object", async () => {
            expect(resource.raw(entity)).toEqual(entity);
        });
    });
});
