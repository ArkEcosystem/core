import { Contracts } from "@arkecosystem/core-kernel";
import { app } from "@arkecosystem/core-kernel";

const lastBlock = app.blockchain.getLastBlock();

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
            maximum: lastBlock ? app.getConfig().getMilestone(lastBlock.data.height).activeDelegates : 51,
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
