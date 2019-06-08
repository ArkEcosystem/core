import { Identities, Interfaces, Managers } from "@arkecosystem/crypto";

export const isRecipientOnActiveNetwork = (transaction: Interfaces.ITransactionData): boolean => {
    return Identities.Address.decodeCheck(transaction.recipientId).readUInt8(0) === Managers.configManager.get("network.pubKeyHash");
};
