import { EntityType, EntitySubType, EntityAction } from "@arkecosystem/core-magistrate-crypto/src/enums";
import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
export const validUpdates: Interfaces.IEntityAsset[] = [
    // array of update assets
    // we expect to have the wallet updated accordingly after
    {
        type: EntityType.Business,
        subType: EntitySubType.None,
        action: EntityAction.Update,
        registrationId: "521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b",
        data: {
            ipfsData: "Qmbw6QmF6ttZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    }
];