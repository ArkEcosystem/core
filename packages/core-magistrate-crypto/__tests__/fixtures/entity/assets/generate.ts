import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { EntityAction, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";

// valid types already assigned (in enum EntityType) + other "custom" but valid types (in range 0-255)
const allTypes = [
    EntityType.Business,
    EntityType.Product,
    EntityType.Module,
    EntityType.Delegate,
    EntityType.Plugin,
    99,
    255,
];
const allSubTypes = [0, 3, 77, 255]; // a few valid subTypes containing min (0) and max (255)
const allActions = [EntityAction.Register, EntityAction.Update, EntityAction.Resign];
const registrationIds = [undefined, "c8b924ec44ac3341a110d440f630149e97c8c9c630dff5040466834096eba7f9"];
const datas = [{ name: "the name of the entity" }, { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ" }];
const specialDatas = [
    // special datas where data => ser => deser does not give back data (see examples)
    // basically, empty string is considered undefined
    // [dataToSerialize, expectedDeserialized]
    [{ name: "" }, {}],
    [{ ipfsData: "" }, {}],
];

// base asset properties we will use to generate all kind of {data} with it
const baseAssets = [
    {
        type: EntityType.Module,
        subType: 0,
        action: EntityAction.Update,
        registrationId: "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c",
    },
    {
        type: EntityType.Plugin,
        subType: 1,
        action: EntityAction.Register,
        registrationId: undefined,
    },
];

export const generateAssets = () => {
    // generate all combinations of { type, subType, action, registrationId}
    // with the same { data }
    const assets: IEntityAsset[] = [];
    for (const type of allTypes) {
        for (const subType of allSubTypes) {
            for (const action of allActions) {
                for (const registrationId of registrationIds) {
                    assets.push({
                        type,
                        subType,
                        action,
                        registrationId,
                        data: {}, // in theory (for ser/deser) we could have empty {data}
                    });
                }
            }
        }
    }

    for (const baseAsset of baseAssets) {
        for (const data of datas) {
            assets.push({
                ...baseAsset,
                data,
            });
        }
    }

    return assets;
};

// generateSpecialAssets returns [assetToSerialize, expectedAssetDeserialized]
export const generateSpecialAssets = () => {
    const assets: any[] = [];
    for (const baseAsset of baseAssets) {
        for (const [dataToSerialize, expectedDeserialized] of specialDatas) {
            assets.push([
                {
                    ...baseAsset,
                    data: dataToSerialize,
                },
                {
                    ...baseAsset,
                    data: expectedDeserialized,
                },
            ]);
        }
    }

    return assets;
};
