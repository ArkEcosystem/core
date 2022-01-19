import { Enums, Interfaces } from "@packages/core-magistrate-crypto/src";

import { invalidAssetData, validAssetData } from "./utils";

export const validRegisters: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {
            name: "my_plugin_for_desktop_wallet",
        },
    },
    ...validAssetData.map((data) => ({
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Register,
        data: {
            name: "my_@&$-module!...",
            ...data,
        },
    })),
];

export const invalidRegisters: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {}, // should have at least a name
    },
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {
            name: "my plugin for desktop wallet that has a name too loong", // name max 40 characters
        },
    },
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {
            name: "invalid \u0000 char",
        },
    },
    ...invalidAssetData.map((data) => ({
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        data: {
            name: "my_module",
            ...data,
        },
    })),
];

export const unserializableRegisters: Interfaces.IEntityAsset[] = [
    {
        type: 256, // max 255
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {
            name: "validname",
        },
    },
    {
        type: -1, // min 0
        subType: 1,
        action: Enums.EntityAction.Register,
        data: {
            name: "validname",
        },
    },
    {
        type: Enums.EntityType.Plugin,
        subType: 256, // max 255
        action: Enums.EntityAction.Register,
        data: {
            name: "validname",
        },
    },
    {
        type: Enums.EntityType.Plugin,
        subType: -1, // min 0
        action: Enums.EntityAction.Register,
        data: {
            name: "validname",
        },
    },
];
