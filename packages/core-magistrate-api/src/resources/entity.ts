import { Resources as CoreResources, Schemas } from "@arkecosystem/core-api";
import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces } from "@arkecosystem/core-magistrate-crypto";
import Joi from "joi";

export type EntityCriteria = Contracts.Search.StandardCriteriaOf<EntityResource>;

export type EntityResource = {
    id: string;
    publicKey: string;
    address: string;
    isResigned: boolean;
    type: number;
    subType: number;
    data: Interfaces.IEntityAssetData;
};

export const entityCriteriaSchemaObject = {
    id: CoreResources.transactionCriteriaSchemaObject.id,
    publicKey: CoreResources.walletCriteriaSchemaObject.publicKey,
    address: CoreResources.walletCriteriaSchemaObject.address,
    isResigned: Joi.boolean(),
    type: Joi.number().min(0).max(255),
    subType: Joi.number().min(0).max(255),
    data: {
        name: Joi.string(),
        ipfsData: Joi.string(),
    },
};

export const entityParamSchema = CoreResources.transactionIdSchema;
export const entityCriteriaSchema = Schemas.createCriteriaSchema(entityCriteriaSchemaObject);
export const entitySortingSchema = Schemas.createSortingSchema(entityCriteriaSchemaObject);
