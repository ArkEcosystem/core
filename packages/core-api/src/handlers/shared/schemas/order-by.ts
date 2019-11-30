import Joi from "@hapi/joi";

const customJoi = Joi.extend(joi => ({
    base: joi.array(),
    name: "orderBy",
    coerce: (value, state, options) => (value.split ? value.split(":") : value),
}));

export const orderBy = customJoi
    .orderBy()
    .length(2)
    .items(
        Joi.string()
            .valid(
                "address",
                "amount",
                "approval",
                "balance",
                "blockId",
                "confirmations",
                "expirationType",
                "expirationValue",
                "fee",
                "forgedFees",
                "forgedRewards",
                "forgedTotal",
                "generatorPublicKey",
                "height",
                "id",
                "isDelegate",
                "isResigned",
                "latency",
                "lockedBalance",
                "nonce",
                "producedBlocks",
                "publicKey",
                "rank",
                "recipient",
                "sender",
                "senderPublicKey",
                "signature",
                "signSignature",
                "timestamp",
                "transactions",
                "type",
                "typeGroup",
                "username",
                "vendorField",
                "version",
                "voteBalance",
                "votes",
            )
            .required(),
        Joi.string()
            .valid("asc", "desc")
            .required(),
    );
