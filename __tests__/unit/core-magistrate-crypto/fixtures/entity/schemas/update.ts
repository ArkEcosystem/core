import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { validAssetData, invalidAssetData } from "./utils";

export const validUpdates = [
    {
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.PluginDesktop, // this should be valid for schema (only invalid for handler)
        action: Enums.EntityAction.Update,
        data: {
            images: ["https://flickr.com/something"]
        }
    },
    ...validAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data
    }))
];

export const invalidUpdates = [
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
