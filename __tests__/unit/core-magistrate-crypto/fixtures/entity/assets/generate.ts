import { IEntityAsset } from "@arkecosystem/core-magistrate-crypto/dist/interfaces";
import { EntityAction, EntitySubType, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";

const allTypes = [EntityType.Business, EntityType.Bridgechain, EntityType.Developer, EntityType.Plugin];
const allSubTypes = [EntitySubType.None, EntitySubType.PluginCore, EntitySubType.PluginDesktop];
const allActions = [EntityAction.Register, EntityAction.Update, EntityAction.Resign];
const registrationIds = [undefined, "c8b924ec44ac3341a110d440f630149e97c8c9c630dff5040466834096eba7f9"];

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

    return assets;
};
