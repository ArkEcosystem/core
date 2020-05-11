import { CryptoManager } from "@arkecosystem/crypto/src";
import { Interfaces as BlockInterfaces } from "@packages/core-crypto";
import { Models } from "@packages/core-database";
import { Interfaces } from "@packages/crypto";

export const mapTransactionToModel = <T extends BlockInterfaces.IBlockData = BlockInterfaces.IBlockData>(
    transaction: Interfaces.ITransaction,
    cryptoManager: CryptoManager<T> = CryptoManager.createFromPreset("testnet"),
    sequence: number = 0,
): Models.Transaction => {
    return {
        id: transaction.id!,
        version: transaction.data.version || 1,
        blockId: transaction.data.blockId || "",
        sequence: sequence,
        timestamp: transaction.data.timestamp,
        nonce: transaction.data.nonce || cryptoManager.LibraryManager.Libraries.BigNumber.make(1),
        senderPublicKey: transaction.data.senderPublicKey || "",
        recipientId: transaction.data.recipientId || "",
        type: transaction.data.type,
        typeGroup: transaction.data.typeGroup || 1,
        vendorField: transaction.data.vendorField,
        amount: cryptoManager.LibraryManager.Libraries.BigNumber.make(transaction.data.amount),
        fee: cryptoManager.LibraryManager.Libraries.BigNumber.make(transaction.data.fee),
        serialized: transaction.serialized,
        asset: transaction.data.asset as Record<string, any>,
    };
};
