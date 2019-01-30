import { app } from "@arkecosystem/core-kernel";
import { crypto, models } from "@arkecosystem/crypto";
import createHash from "create-hash";
import { camelizeKeys } from "xcase";

const { Block, Transaction } = models;

export const verifyData = (context, data, prevData, signatureVerification) => {
    const verifyTransaction = () => {
        if (!signatureVerification) {
            return true;
        }

        const transaction = new Transaction(Buffer.from(data.serialized).toString("hex"));
        return transaction.verified;
    };

    const isBlockChained = () => {
        if (!prevData) {
            return true;
        }
        // genesis payload different as block.serialize stores
        // block.previous_block with 00000 instead of null
        // it fails on height 2 - chain check
        // hardcoding for now
        // TODO: check to improve ser/deser for genesis, add mainnet
        if (
            data.height === 2 &&
            data.previous_block === "13114381566690093367" &&
            prevData.id === "12760288562212273414"
        ) {
            return true;
        }
        return data.height - prevData.height === 1 && data.previous_block === prevData.id;
    };

    const verifyBlock = () => {
        if (!isBlockChained()) {
            app.logger.error(
                `Blocks are not chained. Current block: ${JSON.stringify(data)}, previous block: ${JSON.stringify(
                    prevData,
                )}`,
            );
            return false;
        }

        // TODO: manually calculate block ID and compare to existing
        if (signatureVerification) {
            const bytes: any = Block.serialize(camelizeKeys(data), false);
            const hash = createHash("sha256")
                .update(bytes)
                .digest();

            const signatureVerify = crypto.verifyHash(hash, data.block_signature, data.generator_public_key);
            if (!signatureVerify) {
                app.logger.error(`Failed to verify signature: ${JSON.stringify(data)}`);
            }
            return signatureVerify;
        }

        return true;
    };

    switch (context) {
        case "blocks":
            return verifyBlock();
        case "transactions":
            return verifyTransaction();
        default:
            return false;
    }
};

export const canImportRecord = (context, data, lastBlock) => {
    if (!lastBlock) {
        // empty db
        return true;
    }
    switch (context) {
        case "blocks":
            return data.height > lastBlock.height;
        case "transactions":
            return data.timestamp > lastBlock.timestamp;
        default:
            return false;
    }
};
