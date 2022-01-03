import { Enums, Interfaces } from "@packages/core-magistrate-crypto/src";

import { invalidAssetData, validAssetData } from "./utils";

export const validUpdates: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Module,
        subType: 1, // this should be valid for schema (only invalid for handler)
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    ...validAssetData.map((data) => ({
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data,
    })),
];

export const invalidUpdates: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        data: {
            name: "name cannot be updated", // name is the only prop that cannot be updated
        },
    },
    ...invalidAssetData.map((data) => ({
        type: Enums.EntityType.Module,
        subType: 0,
        action: Enums.EntityAction.Update,
        data,
    })),
];

export const unserializableUpdates: Interfaces.IEntityAsset[] = [
    {
        type: Enums.EntityType.Plugin,
        subType: 256, // max 255
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    {
        type: Enums.EntityType.Plugin,
        subType: -1, // min 0
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    {
        type: 256, // max 255
        subType: 1,
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
    {
        type: -1, // min 0
        subType: 1,
        action: Enums.EntityAction.Update,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
        },
    },
];
