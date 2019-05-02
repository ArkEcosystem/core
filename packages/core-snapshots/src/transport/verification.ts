import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Blocks, Crypto, Managers, Transactions } from "@arkecosystem/crypto";
import { camelizeKeys } from "xcase";

export const verifyData = (context, data, prevData, verifySignatures) => {
    if (context === "blocks") {
        const isBlockChained = () => {
            if (!prevData) {
                return true;
            }
            // genesis payload different as block.serialize stores
            // block.previous_block with 00000 instead of undefined
            // it fails on height 2 - chain check
            // TODO: check to improve ser/deser for genesis
            const genesisBlock = Managers.configManager.get("genesisBlock");
            if (data.height === 2 && data.previous_block === genesisBlock.id) {
                return true;
            }

            return data.height - prevData.height === 1 && data.previous_block === prevData.id;
        };

        if (!isBlockChained()) {
            app.resolvePlugin<Logger.ILogger>("logger").error(
                `Blocks are not chained. Current block: ${JSON.stringify(data)}, previous block: ${JSON.stringify(
                    prevData,
                )}`,
            );
            return false;
        }

        // TODO: manually calculate block ID and compare to existing
        if (verifySignatures) {
            const bytes = Blocks.Block.serialize(camelizeKeys(data), false);
            const hash = Crypto.HashAlgorithms.sha256(bytes);

            const signatureVerify = Crypto.Hash.verifyECDSA(hash, data.block_signature, data.generator_public_key);

            if (!signatureVerify) {
                app.resolvePlugin<Logger.ILogger>("logger").error(
                    `Failed to verify signature: ${JSON.stringify(data)}`,
                );
            }

            return signatureVerify;
        }

        return true;
    }

    if (context === "transactions") {
        if (!verifySignatures) {
            return true;
        }

        return Transactions.TransactionFactory.fromBytes(data.serialized).verified;
    }

    if (context === "rounds") {
        return true;
    }

    return false;
};

export const canImportRecord = (context, data, lastBlock) => {
    if (!lastBlock) {
        return true;
    }

    if (context === "blocks") {
        return data.height > lastBlock.height;
    }

    if (context === "transactions") {
        return data.timestamp > lastBlock.timestamp;
    }

    if (context === "rounds") {
        return true;
    }

    return false;
};
