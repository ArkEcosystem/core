import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { EntityAction, EntitySubType, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";

const allTypes = [EntityType.Business, EntityType.Bridgechain, EntityType.Developer, EntityType.Plugin];
const allSubTypes = [EntitySubType.None, EntitySubType.PluginCore, EntitySubType.PluginDesktop];
const allActions = [EntityAction.Register, EntityAction.Update, EntityAction.Resign];
const registrationIds = [undefined, "c8b924ec44ac3341a110d440f630149e97c8c9c630dff5040466834096eba7f9"];

const datas = [{ name: "the name of the entity" }, { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ" }];

const specialDatas = [
    [{ name: "" }, {}],
    [{ ipfsData: "" }, {}],
];

const baseAssets = [
    {
        type: EntityType.Developer,
        subType: EntitySubType.None,
        action: EntityAction.Update,
        registrationId: "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c",
    },
    {
        type: EntityType.Plugin,
        subType: EntitySubType.PluginDesktop,
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

                    assets.push({
                        type,
                        subType,
                        action,
                        registrationId,
                        data: {
                            name: "name",
                            ipfsData: "ipfsData",
                        },
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
