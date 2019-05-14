import { Interfaces, Managers } from "@arkecosystem/crypto";
import bs58check from "bs58check";

export const isRecipientOnActiveNetwork = (transaction: Interfaces.ITransactionData): boolean => {
    return bs58check.decode(transaction.recipientId).readUInt8(0) === Managers.configManager.get("network.pubKeyHash");
};
