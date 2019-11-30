import Joi from "@hapi/joi";

const customJoi = Joi.extend(joi => ({
    base: joi.array(),
    name: "orderBy",
    coerce: (value, state, options) => (value && value.split ? value.split(":") : undefined),
}));

const validIteratees = [
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
];

const validDirections = ["asc", "desc"];

export const orderBy = customJoi
    .orderBy()
    .length(2)
    .items(
        Joi.string()
            .valid(...validIteratees)
            .required(),
        Joi.string()
            .valid(...validDirections)
            .required(),
    )
    .error(
        () =>
            `"orderBy" must have the following format <iteratee>:<direction>, where <iteratee> is one of: ${validIteratees.join(
                ", ",
            )} and <direction> one of: ${validDirections.join(", ")}`,
    );
