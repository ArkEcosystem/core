import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { validAssetData, invalidAssetData } from "./utils";

export const validResigns = [
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {},
    }
];

export const invalidResigns = [
    {
        type: Enums.EntityType.Plugin,
        subType: Enums.EntitySubType.PluginDesktop,
        action: Enums.EntityAction.Resign,
        registrationId: "e77a1d1d080ebce113dd27e1cb0a242ec8600fb72cd62ace4e46148bee1d3acc",
        data: {
            name: "why a name" // no property allowed in data for resign
        },
    },
    ...invalidAssetData.map(data => ({
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data
    })),
    ...validAssetData.map(data => ({ // even "valid" data are invalid for resign as we allow no property in data
        type: Enums.EntityType.Developer,
        subType: Enums.EntitySubType.None,
        action: Enums.EntityAction.Update,
        data
    }))
];
