import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
import { EntityAction, EntitySubType, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";
export const validRegisters: Interfaces.IEntityAsset[] = [
    // array of register assets
    // we expect to have the wallet state like { entities: { [txId]: { ...asset.data } } } after
    {
        type: EntityType.Business,
        subType: EntitySubType.None,
        action: EntityAction.Register,
        data: {
            name: "my_business_1",
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
];
