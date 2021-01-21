import { Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import Joi from "joi";

import * as Schemas from "../schemas";
import { blockCriteriaSchemaObject } from "./block";
import { walletCriteriaSchemaObject } from "./wallet";

export type DelegateCriteria = Contracts.Search.StandardCriteriaOf<DelegateResource>;

export type DelegateResource = {
    username: string;
    address: string;
    publicKey: string;
    votes: Utils.BigNumber;
    rank: number;
    isResigned: boolean;
    blocks: {
        produced: number;
        last: DelegateResourceLastBlock | undefined;
    };
    production: {
        approval: number;
    };
    forged: {
        fees: Utils.BigNumber;
        rewards: Utils.BigNumber;
        total: Utils.BigNumber;
    };
};

export type DelegateResourceLastBlock = {
    id: string;
    height: number;
    timestamp: {
        epoch: number;
        unix: number;
        human: string;
    };
};

export const delegateCriteriaSchemaObject = {
    username: Joi.string().max(256),
    address: walletCriteriaSchemaObject.address,
    publicKey: walletCriteriaSchemaObject.publicKey,
    votes: Schemas.createRangeCriteriaSchema(Schemas.nonNegativeBigNumber),
    rank: Schemas.createRangeCriteriaSchema(Joi.number().integer().min(1)),
    isResigned: Joi.boolean(),
    blocks: {
        produced: Schemas.createRangeCriteriaSchema(Joi.number().integer().min(0)),
        last: {
            id: blockCriteriaSchemaObject.id,
            height: blockCriteriaSchemaObject.height,
            timestamp: {
                epoch: Schemas.createRangeCriteriaSchema(Joi.number().integer().min(0)),
                unix: Schemas.createRangeCriteriaSchema(Joi.number().integer().min(0)),
                human: Joi.string(),
            },
        },
    },
    production: {
        approval: Schemas.createRangeCriteriaSchema(Joi.number().min(0)),
    },
    forged: {
        fees: Schemas.createRangeCriteriaSchema(Schemas.nonNegativeBigNumber),
        rewards: Schemas.createRangeCriteriaSchema(Schemas.nonNegativeBigNumber),
        total: Schemas.createRangeCriteriaSchema(Schemas.nonNegativeBigNumber),
    },
};

export const delegateCriteriaSchema = Schemas.createCriteriaSchema(delegateCriteriaSchemaObject);
export const delegateSortingSchema = Schemas.createSortingSchema(delegateCriteriaSchemaObject);
