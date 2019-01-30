import { Contracts } from "@arkecosystem/core-kernel";
import { app } from "@arkecosystem/core-kernel";
import { configManager } from "@arkecosystem/crypto";
import bs58check from "bs58check";

/**
 * Checks if transaction recipient is on the same network as blockchain
 * @param {Transaction}
 * @return {Boolean}
 */
export function isRecipientOnActiveNetwork(transaction) {
    const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0);

    if (recipientPrefix === configManager.get("pubKeyHash")) {
        return true;
    }

    app.resolve<Contracts.Logger.ILogger>("logger").error(
        `Recipient ${transaction.recipientId} is not on the same network: ${configManager.get("pubKeyHash")}`,
    );

    return false;
}
