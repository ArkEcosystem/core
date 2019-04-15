import { Interfaces, Managers } from "@arkecosystem/crypto";
import bs58check from "bs58check";

export function isRecipientOnActiveNetwork(transaction: Interfaces.ITransactionData): boolean {
    const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0);

    return recipientPrefix === Managers.configManager.get("network.pubKeyHash");
}
