import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Blocks, Crypto, Transactions, Utils } from "@arkecosystem/crypto";
import { camelizeKeys } from "xcase";

export const verifyData = (context, data, prevData, verifySignatures) => {
    if (context === "blocks") {
        const isBlockChained = () => {
            if (!prevData) {
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

export const canImportRecord = (context, data, options) => {
    if (!options.lastBlock) {
        return true;
    }

    if (context === "blocks") {
        return data.height > options.lastBlock.height;
    }

    if (context === "transactions") {
        return data.timestamp > options.lastBlock.timestamp;
    }

    if (context === "rounds") {
        if (options.lastRound === null) {
            return true;
        }

        const dataRound = Number(data.round);
        const lastRound = Number(options.lastRound.round);
        if (dataRound > lastRound) {
            return true;
        }
        if (dataRound < lastRound) {
            return false;
        }

        const dataBalance = Utils.BigNumber.make(data.balance);
        const lastBalance = Utils.BigNumber.make(options.lastRound.balance);
        if (dataBalance.isLessThan(lastBalance)) {
            return true;
        }
        if (dataBalance.isGreaterThan(lastBalance)) {
            return false;
        }

        if (data.public_key > options.lastRound.publicKey) {
            return true;
        }

        return false;
    }

    return false;
};
