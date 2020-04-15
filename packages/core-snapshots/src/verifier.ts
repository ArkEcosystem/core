import { Models } from "@arkecosystem/core-database";
import { Blocks, Interfaces, Crypto } from "@arkecosystem/crypto";

export class BlockTransformer {
    public static fromModel(blockEntity: Models.Block): Interfaces.IBlock {
        return Blocks.BlockFactory.fromData(blockEntity as Interfaces.IBlockData)!;
    }
}

// TODO: check packages/crypto/src/transactions/verifier.ts
export class Verifier {
    public static verifyBlock(block: Models.Block, previousBlock: Models.Block | undefined): boolean {
        return Verifier.isBlockChained(block, previousBlock) && Verifier.verifyBlockSignature(block)
    }

    public static verifyTransaction(transaction: Models.Transaction): boolean {
        return Verifier.verifyTransactionSignature(transaction);
    }

    public static verifyRound(round: Models.Round): boolean {
        return true;
    }

    private static isBlockChained(block: Models.Block, previousBlock: Models.Block | undefined): boolean {
        if(!previousBlock) {
            return true;
        }

        const isBlockChained = block.height - previousBlock.height === 1 && block.previousBlock === previousBlock.id;

        if (!isBlockChained) {
            console.log(`Block ${block.id} on height ${block.height} is not chained`);
        }

        return isBlockChained;
    }

    private static verifyBlockSignature(blockEntity: Models.Block): boolean {
        let block = BlockTransformer.fromModel(blockEntity);

        const bytes = Blocks.Serializer.serialize(block.data, false);
        const hash = Crypto.HashAlgorithms.sha256(bytes);

        const signatureVerify = Crypto.Hash.verifyECDSA(hash, blockEntity.blockSignature, blockEntity.generatorPublicKey);

        if (!signatureVerify) {
            console.log(`Block ${blockEntity.id} on height ${blockEntity.height} does not have valid signature`);
        }

        return signatureVerify;
    }

    private static verifyTransactionSignature(transaction: Models.Transaction): boolean {
        return true;

        // TODO: Change verification system. Does not support version 1.
        // const transactionDeserialized = Transactions.Deserializer.deserialize(transaction.serialized.toString("hex"), { acceptLegacyVersion: true });

        // let isTransactionVerified = Transactions.Verifier.verifyHash(transactionDeserialized.data)
        // const isTransactionVerified = Transactions.TransactionFactory.fromBytes(transaction.serialized).verified;

        // return isTransactionVerified;
    }
}
