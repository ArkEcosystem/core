import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
import { EntityAction, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";
export const validResigns: Interfaces.IEntityAsset[] = [
    // array of register assets
    // we expect to have the wallet with the entity removed after
    {
        type: EntityType.Business,
        subType: 0,
        action: EntityAction.Resign,
        registrationId: "521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b",
        data: {},
    },
    {
        type: 43,
        subType: 255,
        action: EntityAction.Resign,
        registrationId: "521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b",
        data: {},
    },
    {
        type: 255,
        subType: 255,
        action: EntityAction.Resign,
        registrationId: "521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b",
        data: {},
    },
];
