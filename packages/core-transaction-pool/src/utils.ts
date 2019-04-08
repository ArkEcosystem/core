import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { configManager, interfaces } from "@arkecosystem/crypto";
import bs58check from "bs58check";

const logger = app.resolvePlugin<Logger.ILogger>("logger");

/**
 * Checks if transaction recipient is on the same network as blockchain
 */
export function isRecipientOnActiveNetwork(transaction: interfaces.ITransactionData): boolean {
    const recipientPrefix = bs58check.decode(transaction.recipientId).readUInt8(0);

    if (recipientPrefix === configManager.get("pubKeyHash")) {
        return true;
    }

    logger.error(`Recipient ${transaction.recipientId} is not on the same network: ${configManager.get("pubKeyHash")}`);

    return false;
}
