import { Interfaces, Managers } from "@arkecosystem/crypto";
import bs58check from "bs58check";

export function isRecipientOnActiveNetwork(transaction: Interfaces.ITransactionData): boolean {
    try {
        return (
            bs58check.decode(transaction.recipientId).readUInt8(0) === Managers.configManager.get("network.pubKeyHash")
        );
    } catch {
        return false;
    }
}
