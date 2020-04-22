import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Crypto, Transactions } from "@arkecosystem/crypto";
import { Managers } from "@arkecosystem/crypto";
import * as Exceptions from "./exceptions/verifier";

export class Verifier {
    public static verifyBlock(block: Models.Block, previousBlock: Models.Block | undefined): void {
        Verifier.isBlockChained(block, previousBlock);
        Verifier.verifyBlockSignature(block);
    }

    public static verifyTransaction(transaction: Models.Transaction): void {
        Verifier.verifyTransactionSignature(transaction);
    }

    public static verifyRound(round: Models.Round): void {
        if(round.publicKey.length !== 66) {
            throw new Exceptions.TransactionVerifyException(round.round.toString());
        };
    }

    private static isBlockChained(block: Models.Block, previousBlock: Models.Block | undefined): void {
        if(!previousBlock) {
            return;
        }

        const isBlockChained = block.height - previousBlock.height === 1 && block.previousBlock === previousBlock.id;

        if (!isBlockChained) {
            throw new Exceptions.BlockNotChainedException(block.id);
        }
    }

    private static verifyBlockSignature(blockEntity: Models.Block): void {
        let isVerified = false;

        try {
            let block = Blocks.BlockFactory.fromData(blockEntity as Interfaces.IBlockData)!;

            const bytes = Blocks.Serializer.serialize(block.data, false);
            const hash = Crypto.HashAlgorithms.sha256(bytes);

            isVerified = Crypto.Hash.verifyECDSA(hash, blockEntity.blockSignature, blockEntity.generatorPublicKey);
        } catch {}

        if (!isVerified) {
            throw new Exceptions.BlockVerifyException(blockEntity.id);
        }
    }

    private static verifyTransactionSignature(transaction: Models.Transaction): void {
        if (transaction.timestamp === 0) {
            return
        }

        try {
            if (transaction.id === "a454eb013c31e53d058b02ae7b41a713ef177b0d36f03ed5db4ac2f97926d281") {
                console.log(Managers.configManager.getHeight());
                console.log(Managers.configManager.getHeight());
                console.log(Managers.configManager.getHeight());
            }
            if (!Transactions.TransactionFactory.fromBytes(transaction.serialized).isVerified) {

                console.log("NOT VERIFIED");
                throw new Error();
            }
        } catch (e) {
            throw new Exceptions.TransactionVerifyException(transaction.id);
        }


    }
}
