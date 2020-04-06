import Joi from "@hapi/joi";

export const peerSchemas = {
    "p2p.peer.getPeers": Joi.object().max(0), // empty object expected

    "p2p.peer.getBlocks": Joi.object({
        lastBlockHeight: Joi.number().integer().min(1),
        blockLimit: Joi.number().integer().min(1).max(400),
        headersOnly: Joi.boolean(),
        serialized: Joi.boolean(),
    }),

    "p2p.peer.getCommonBlocks": Joi.object({
        ids: Joi.array().min(1).max(10).items(Joi.string()) // TODO strings are block ids
    }),

    "p2p.peer.getStatus": Joi.object().max(0), // empty object expected

    "p2p.peer.postBlock": Joi.object({
        block: Joi.object({
            type: "Buffer",
            data: Joi.array() // TODO better way to validate buffer ?
        })
    }),

    "p2p.peer.postTransactions": Joi.object({
        transactions: Joi.array() // TODO array of transactions, needs Joi transaction schema
    })
}