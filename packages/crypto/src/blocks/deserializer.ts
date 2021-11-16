import ByteBuffer from "bytebuffer";

import { CryptoError } from "../errors";
import { IBlockData, ITransaction } from "../interfaces";
import { configManager } from "../managers";
import { TransactionFactory } from "../transactions";
import { BigNumber } from "../utils";
import { Serializer } from "./serializer";

export class Deserializer {
    public static deserialize(
        serialized: Buffer,
        headerOnly: boolean = false,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): { data: IBlockData; transactions: ITransaction[] } {
        const block = {} as IBlockData;
        let transactions: ITransaction[] = [];

        const buf: ByteBuffer = new ByteBuffer(serialized.length, true);
        buf.append(serialized);
        buf.reset();

        this.deserializeHeader(block, buf);

        headerOnly = headerOnly || buf.remaining() === 0;
        if (!headerOnly) {
            transactions = this.deserializeTransactions(block, buf, options.deserializeTransactionsUnchecked);
        }

        block.id = Serializer.getId(block);
        block.idHex = Serializer.getIdHex(block.id!);

        return { data: block, transactions };
    }

    private static deserializeHeader(block: IBlockData, buf: ByteBuffer): void {
        // uint32 and int32 are equal up to 2**31−1
        const height = buf.readUint32(8);

        if (height === 1) {
            block.version = buf.readInt32();
            block.timestamp = buf.readInt32();
            block.height = buf.readInt32();

            if (buf.readBytes(8).toString("hex") !== "0000000000000000") {
                throw new CryptoError("Invalid genesis block.");
            }

            // block.previousBlock = buf.readBytes(8).BE().readUint64().toString();
            // if (block.previousBlock !== "0") {
            //     throw new CryptoError("Invalid genesis block.");
            // }
            // block.previousBlockHex = Serializer.getIdHex(block.previousBlock);

            block.numberOfTransactions = buf.readInt32();
            block.totalAmount = BigNumber.make(buf.readInt64().toString());
            block.totalFee = BigNumber.make(buf.readInt64().toString());
            block.reward = BigNumber.make(buf.readInt64().toString());
            block.payloadLength = buf.readInt32();
        } else {
            const previousConstants = configManager.getMilestone(height - 1);

            block.version = buf.readUint32();
            block.timestamp = buf.readUint32();
            block.height = buf.readUint32();

            block.previousBlock = previousConstants.block.idFullSha256
                ? buf.readBytes(32).toString("hex")
                : buf.readBytes(8).BE().readUint64().toString();

            block.previousBlockHex = Serializer.getIdHex(block.previousBlock);
            block.numberOfTransactions = buf.readUint32();
            block.totalAmount = BigNumber.make(buf.readUint64().toString());
            block.totalFee = BigNumber.make(buf.readUint64().toString());
            block.reward = BigNumber.make(buf.readUint64().toString());
            block.payloadLength = buf.readUint32();
        }

        block.payloadHash = buf.readBytes(32).toString("hex");
        block.generatorPublicKey = buf.readBytes(33).toString("hex");
        block.blockSignature = buf.readBytes(2 + buf.readUint8(buf.offset + 1)).toString("hex");
    }

    private static deserializeTransactions(
        block: IBlockData,
        buf: ByteBuffer,
        deserializeTransactionsUnchecked: boolean = false,
    ): ITransaction[] {
        const transactionLengths: number[] = [];

        for (let i = 0; i < block.numberOfTransactions; i++) {
            transactionLengths.push(buf.readUint32());
        }

        const transactions: ITransaction[] = [];
        block.transactions = [];
        for (const length of transactionLengths) {
            const transactionBytes = buf.readBytes(length).toBuffer();
            const transaction = deserializeTransactionsUnchecked
                ? TransactionFactory.fromBytesUnsafe(transactionBytes)
                : TransactionFactory.fromBytes(transactionBytes);
            transactions.push(transaction);
            block.transactions.push(transaction.data);
        }

        return transactions;
    }
}
