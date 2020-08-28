import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
import { EntityAction, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";
export const validRegisters: Interfaces.IEntityAsset[] = [
    // array of register assets
    // we expect to have the wallet state like { entities: { [txId]: { ...asset.data } } } after
    {
        type: EntityType.Business,
        subType: 0,
        action: EntityAction.Register,
        data: {
            name: "my_business_1",
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    {
        type: EntityType.Business,
        subType: 45,
        action: EntityAction.Register,
        data: {
            name: "my_business_1",
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    {
        type: EntityType.Developer,
        subType: 255,
        action: EntityAction.Register,
        data: {
            name: "my_business_1",
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
];
