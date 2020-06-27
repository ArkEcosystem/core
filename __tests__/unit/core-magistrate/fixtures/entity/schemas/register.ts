import { Enums, Interfaces } from "@arkecosystem/core-magistrate-crypto/src";
import { invalidAssetData, validAssetData } from "./utils";

export const validRegisters: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Register,
        data: {
            name: "my_plugin_for_desktop_wallet",
        },
    },
    ...validAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Register,
        data: {
            name: "my_developer",
            ...data,
        },
    })),
];

export const invalidRegisters: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Register,
        data: {}, // should have at least a name
    },
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Register,
        data: {
            name: "my plugin for desktop wallet that has a name too loong", // name max 40 characters
        },
    },
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Register,
        data: {
            name: "invalid \u0000 char",
        },
    },
    ...invalidAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data: {
            name: "my developer",
            ...data,
        },
    })),
];
