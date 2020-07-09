import { Models } from "@arkecosystem/core-database";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export const mapTransactionToModel = (
    transaction: Interfaces.ITransaction,
    blockHeight?: number,
    sequence?: number,
): Models.Transaction => {
    return {
        id: transaction.id!,
        version: transaction.data.version || 1,
        blockId: transaction.data.blockId || "",
        blockHeight: blockHeight ?? transaction.data.blockHeight ?? 0,
        sequence: sequence ?? transaction.data.sequence ?? 0,
        timestamp: transaction.data.timestamp,
        nonce: transaction.data.nonce || Utils.BigNumber.make(1),
        senderPublicKey: transaction.data.senderPublicKey || "",
        recipientId: transaction.data.recipientId || "",
        type: transaction.data.type,
        typeGroup: transaction.data.typeGroup || 1,
        vendorField: transaction.data.vendorField,
        amount: Utils.BigNumber.make(transaction.data.amount),
        fee: Utils.BigNumber.make(transaction.data.fee),
        serialized: transaction.serialized,
        asset: transaction.data.asset as Record<string, any>,
    };
};
