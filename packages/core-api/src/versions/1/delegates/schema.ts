import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { roundCalculator } from "@arkecosystem/core-utils";

const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

export const forgingStatus: object = {
    type: "object",
    properties: {
        publicKey: {
            type: "string",
            format: "publicKey",
        },
    },
    required: ["publicKey"],
};

export const getDelegate: object = {
    type: "object",
    properties: {
        publicKey: {
            type: "string",
        },
        username: {
            type: "string",
        },
    },
};

export const search: object = {
    type: "object",
    properties: {
        q: {
            type: "string",
            minLength: 1,
            maxLength: 20,
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: 100,
        },
    },
    required: ["q"],
};

export const getVoters: object = {
    type: "object",
    properties: {
        publicKey: {
            type: "string",
            format: "publicKey",
        },
    },
    required: ["publicKey"],
};

export const getDelegates: object = {
    type: "object",
    properties: {
        orderBy: {
            type: "string",
        },
        limit: {
            type: "integer",
            minimum: 1,
            maximum: lastBlock ? roundCalculator.calculateRound(lastBlock.data.height).maxDelegates : 51,
        },
        offset: {
            type: "integer",
            minimum: 0,
        },
    },
};

export const getForgedByAccount: object = {
    type: "object",
    properties: {
        generatorPublicKey: {
            type: "string",
            format: "publicKey",
        },
    },
    required: ["generatorPublicKey"],
};
