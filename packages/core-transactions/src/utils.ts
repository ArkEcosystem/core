import { configManager, ITransactionData } from "@arkecosystem/crypto";
import bs58check from "bs58check";

export function isRecipientOnActiveNetwork(transaction: ITransactionData): boolean {
    const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0);

    if (recipientPrefix === configManager.get("pubKeyHash")) {
        return true;
    }

    return false;
}
