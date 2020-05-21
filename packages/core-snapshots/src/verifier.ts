import { CryptoSuite, Interfaces } from "@arkecosystem/core-crypto";
import { Models } from "@arkecosystem/core-database";

import * as Exceptions from "./exceptions/verifier";

export class Verifier {
    public constructor(private cryptoSuite: CryptoSuite.CryptoSuite) {}
    public verifyBlock(block: Models.Block, previousBlock: Models.Block | undefined): void {
        this.isBlockChained(block, previousBlock);
        this.verifyBlockSignature(block);
    }

    public verifyTransaction(transaction: Models.Transaction): void {
        this.verifyTransactionSignature(transaction);
    }

    public verifyRound(round: Models.Round): void {
        if (round.publicKey.length !== 66) {
            throw new Exceptions.RoundVerifyException(round.round.toString());
        }
    }

    private isBlockChained(block: Models.Block, previousBlock: Models.Block | undefined): void {
        if (!previousBlock) {
            return;
        }

        const isBlockChained = block.height - previousBlock.height === 1 && block.previousBlock === previousBlock.id;

        if (!isBlockChained) {
            throw new Exceptions.BlockNotChainedException(block.id);
        }
    }

    private verifyBlockSignature(blockEntity: Models.Block): void {
        let isVerified = false;

        try {
            /* istanbul ignore next */
            const block = this.cryptoSuite.BlockFactory.fromData(blockEntity as Interfaces.IBlockData, () => {
                return blockEntity.timestamp;
            })!;

            const bytes = this.cryptoSuite.BlockFactory.serializer.serialize(block.data, false);
            const hash = this.cryptoSuite.CryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(bytes);

            isVerified = this.cryptoSuite.CryptoManager.LibraryManager.Crypto.Hash.verifyECDSA(
                hash,
                blockEntity.blockSignature,
                blockEntity.generatorPublicKey,
            );
        } catch (err) {
            throw new Exceptions.BlockVerifyException(blockEntity.id, err.message);
        }

        if (!isVerified) {
            throw new Exceptions.BlockVerifyException(blockEntity.id);
        }
    }

    private verifyTransactionSignature(transaction: Models.Transaction): void {
        if (transaction.timestamp === 0) {
            return;
        }

        let isVerified = false;
        try {
            isVerified = this.cryptoSuite.TransactionManager.TransactionFactory.fromBytes(transaction.serialized)
                .isVerified;
        } catch (err) {
            throw new Exceptions.TransactionVerifyException(transaction.id, err.message);
        }

        if (!isVerified) {
            throw new Exceptions.TransactionVerifyException(transaction.id);
        }
    }
}
