import { Enums, Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
import { validAssetData, invalidAssetData } from "./utils";

export const validUpdates: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.PluginDesktop, // this should be valid for schema (only invalid for handler)
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ"
        }
    },
    ...validAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data
    }))
];

export const invalidUpdates: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data: {
            name: "name cannot be updated" // name is the only prop that cannot be updated
        }
    },
    ...invalidAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data
    }))
];
