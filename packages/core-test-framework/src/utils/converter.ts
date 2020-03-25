import { Interfaces } from "@packages/crypto";
import { Models } from "@packages/core-database";


// TODO: Fix bigint return
export const convertCryptoTransactionToDatabaseTransaction = (transaction: Interfaces.ITransaction, sequence: number = 0): Models.Transaction => {
    return {
        id: transaction.id as string,
        version: transaction.data.version as number,
        blockId: transaction.data.blockId as string,
        sequence: sequence,
        timestamp: transaction.data.timestamp,
        nonce: transaction.data.nonce!.toString() as any,
        senderPublicKey: transaction.data.senderPublicKey as string,
        recipientId: transaction.data.recipientId as string,
        type: transaction.data.type as number,
        typeGroup: transaction.data.typeGroup as number,
        vendorField: transaction.data.vendorField,
        amount: transaction.data.amount.toString() as any,
        fee: transaction.data.fee.toString() as any,
        serialized: transaction.serialized,
        asset: transaction.data.asset as Record<string, any>,
    }
};
