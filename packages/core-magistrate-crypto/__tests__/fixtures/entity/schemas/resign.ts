import { Enums, Interfaces } from "@packages/core-magistrate-crypto/src";

import { invalidAssetData, validAssetData } from "./utils";

export const validResigns: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
    {
        type: 255,
        subType: 32,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
];

export const invalidResigns: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 1,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            name: "why a name", // no property allowed in data for resign
        },
    },
    ...invalidAssetData.map((data) => ({
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        data,
    })),
    ...validAssetData.map((data) => ({
        // even "valid" data are invalid for resign as we allow no property in data
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        data,
    })),
];

export const unserializableResigns: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 256, // max 255
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
    {
        type: Enums.EntityType.Plugin,
        subType: -1, // min 0
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
    {
        type: 256, // max 255
        subType: 1,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
    {
        type: -1, // min 0
        subType: 1,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    },
];
