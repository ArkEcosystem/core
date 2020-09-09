import { Resources as CoreResources, Schemas } from "@arkecosystem/core-api";
import { Contracts } from "@arkecosystem/core-kernel";
import { Enums, Interfaces } from "@arkecosystem/core-magistrate-crypto";
import Joi from "@hapi/joi";

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

export const entityCriteriaSchemaObject = {
    id: CoreResources.transactionCriteriaSchemaObject.id,
    publicKey: CoreResources.walletCriteriaSchemaObject.publicKey,
    address: CoreResources.walletCriteriaSchemaObject.address,
    isResigned: Joi.boolean(),
    type: Joi.number().allow(
        Enums.EntityType.Business,
        Enums.EntityType.Bridgechain,
        Enums.EntityType.Developer,
        Enums.EntityType.Plugin,
    ),
    subType: Joi.number().allow(
        Enums.EntitySubType.None,
        Enums.EntitySubType.PluginCore,
        Enums.EntitySubType.PluginDesktop,
    ),
    data: {
        name: Joi.string(),
        ipfsData: Joi.string(),
    },
};

export const entityParamSchema = CoreResources.transactionIdSchema;
export const entityCriteriaQuerySchema = Joi.object(entityCriteriaSchemaObject);
export const entityCriteriaPayloadSchema = Schemas.createCriteriaPayloadSchema(entityCriteriaSchemaObject);
export const entitySortingSchema = Schemas.createSortingSchema(entityCriteriaSchemaObject);
