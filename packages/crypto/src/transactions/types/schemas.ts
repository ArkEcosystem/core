import { TransactionTypes } from "../../constants";
import { configManager } from "../../managers";
import { ITransactionSchema, TransactionSchemaConstructor } from "../interfaces";

// TODO: cleanup and double check schemata

export const base = joi =>
    joi.object().keys({
        id: joi
            .string()
            .alphanum()
            .length(64)
            .when(joi.ref("$fromData"), {
                is: true,
                then: joi.optional().allow("", null),
                otherwise: joi
                    .string()
                    .alphanum()
                    .length(64)
                    .required(),
            }),
        blockid: joi.alternatives().try(joi.blockId(), joi.number().unsafe()),
        network: joi.lazy(
            () =>
                joi
                    .number()
                    .only(configManager.get("pubKeyHash"))
                    .optional(),
            { once: false },
        ),
        version: joi
            .number()
            .integer()
            .min(1)
            .max(2)
            .optional(),
        timestamp: joi
            .number()
            .integer()
            .min(0)
            .required(),
        amount: joi
            .bignumber()
            .integer()
            .positive()
            .required(),
        fee: joi
            .bignumber()
            .integer()
            .positive()
            .required(),
        senderId: joi.address(),
        recipientId: joi.address().required(),
        senderPublicKey: joi.publicKey().required(),
        signature: joi
            .string()
            .alphanum()
            .when(joi.ref("$fromData"), {
                is: true,
                then: joi.optional().allow("", null),
                otherwise: joi.required(),
            }),
        signatures: joi.array(),
        secondSignature: joi.string().alphanum(),
        signSignature: joi.string().alphanum(),
        confirmations: joi
            .number()
            .integer()
            .min(0),
    });

export const transfer: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "transfer",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.Transfer)
            .required(),
        expiration: joi
            .number()
            .integer()
            .min(0),
        vendorField: joi
            .string()
            .max(64, "utf8")
            .allow("", null)
            .optional(),
        vendorFieldHex: joi
            .string()
            .max(64, "hex")
            .allow("", null)
            .optional(),
        asset: joi.object().empty(),
    },
});

export const secondSignature: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "secondSignature",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.SecondSignature)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        secondSignature: joi.string().only(""),
        asset: joi
            .object({
                signature: joi
                    .object({
                        publicKey: joi.publicKey().required(),
                    })
                    .required(),
            })
            .required(),
        recipientId: joi.empty(),
    },
});

export const delegateRegistration: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "delegateRegistration",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.DelegateRegistration)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        asset: joi
            .object({
                delegate: joi
                    .object({
                        username: joi.delegateUsername().required(),
                        publicKey: joi.publicKey(),
                    })
                    .required(),
            })
            .required(),
        recipientId: joi.empty(),
    },
});

export const vote: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "vote",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.Vote)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        asset: joi
            .object({
                votes: joi
                    .array()
                    .items(
                        joi
                            .string()
                            .length(67)
                            .regex(/^(\+|-)[a-zA-Z0-9]+$/),
                    )
                    .length(1)
                    .required(),
            })
            .required(),
        recipientId: joi
            .address()
            .allow(null)
            .optional(),
    },
});

export const multiSignature: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "multiSignature",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.MultiSignature)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        recipientId: joi.empty(),
        signatures: joi
            .array()
            .length(joi.ref("asset.multisignature.keysgroup.length"))
            .required(),
        asset: joi
            .object({
                multisignature: joi
                    .object({
                        min: joi
                            .when(joi.ref("keysgroup.length"), {
                                is: joi.number().greater(16),
                                then: joi
                                    .number()
                                    .positive()
                                    .max(16),
                                otherwise: joi
                                    .number()
                                    .positive()
                                    .max(joi.ref("keysgroup.length")),
                            })
                            .required(),
                        keysgroup: joi
                            .array()
                            .unique()
                            .min(2)
                            .items(
                                joi
                                    .string()
                                    .not(`+${(base as any).senderPublicKey}`)
                                    .length(67)
                                    .regex(/^\+/)
                                    .required(),
                            )
                            .required(),
                        lifetime: joi
                            .number()
                            .integer()
                            .min(1)
                            .max(72)
                            .required(),
                    })
                    .required(),
            })
            .required(),
    },
});

export const ipfs: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "ipfs",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.Ipfs)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    },
});

export const timelockTransfer: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "timelockTransfer",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.TimelockTransfer)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        asset: joi.object().required(),
        vendorFieldHex: joi
            .string()
            .max(64, "hex")
            .optional(),
        vendorField: joi
            .string()
            .max(64, "utf8")
            .allow("", null)
            .optional(),
        recipientId: joi.empty(),
    },
});

export const multiPayment: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "multiPayment",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.MultiPayment)
            .required(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    },
});

export const delegateResignation: TransactionSchemaConstructor = (joi): ITransactionSchema => ({
    name: "delegateResignation",
    base: {
        type: joi
            .number()
            .only(TransactionTypes.DelegateResignation)
            .required(),
        amount: joi
            .bignumber()
            .only(0)
            .optional(),
        asset: joi.object().required(),
        recipientId: joi.empty(),
    },
});
