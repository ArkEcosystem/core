import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/core-magistrate-crypto";

export type EntityCriteria = Contracts.Search.StandardCriteriaOf<EntityResource>;

export type EntityResource = {
    id: string;
    publicKey: string;
    address: string;
    isResigned: boolean;
    type: Enums.EntityType;
    subType: Enums.EntitySubType;
    data: Interfaces.IEntityAssetData;
};
