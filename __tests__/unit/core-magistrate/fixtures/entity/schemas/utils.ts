// export valid and invalid asset data for registration and update
// excluding `name` property as it is not allowed for update

import { Interfaces } from "@arkecosystem/core-magistrate-crypto/src";

export const validAssetData: Interfaces.IEntityAssetData[] = [
    { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ" },
];

export const invalidAssetData: Interfaces.IEntityAssetData[] = [
    { unknownProperty: "what am I doing here" } as any,
    { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpm" },
    {
        ipfsData:
            "tuZpyV6WyEsTmExkEG3rW4khattQmbw6QmF6tuZpyV6WyV6WyEsTmExkEG3rW4kh6QmF6tuZpyV6W4khattQidPfbpmNZQidmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
    },
    { ipfsData: "thisisNOTbase58" },
    { ipfsData: "" },
];
