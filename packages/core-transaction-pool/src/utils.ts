import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers } from "@arkecosystem/crypto";
import bs58check from "bs58check";

export function isRecipientOnActiveNetwork(transaction: Interfaces.ITransactionData): boolean {
    const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0);

    if (recipientPrefix === Managers.configManager.get("network.pubKeyHash")) {
        return true;
    }

    app.resolvePlugin<Logger.ILogger>("logger").error(
        `Recipient ${transaction.recipientId} is not on the same network: ${Managers.configManager.get(
            "network.pubKeyHash",
        )}`,
    );

    return false;
}
