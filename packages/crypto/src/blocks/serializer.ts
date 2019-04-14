import ByteBuffer from "bytebuffer";
import { PreviousBlockIdFormatError } from "../errors";
import { IBlockData, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { Transaction } from "../transactions";
import { BigNumber } from "../utils";
import { Block } from "./block";

export class Serializer {
    public static serializeWithTransactions(block: IBlockData): Buffer {
        const transactions: ITransactionData[] = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;

        const serializedHeader: Buffer = this.serialize(block);

        const buffer: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);

        for (let i = 0; i < transactions.length; i++) {
            const serialized: Buffer = Transaction.toBytes(transactions[i]);
            buffer.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buffer.append(serialized);
        }

        return buffer.flip().toBuffer();
    }

    public static serialize(block: IBlockData, includeSignature: boolean = true): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(512, true);

        this.serializeHeader(block, buffer);

        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }

        return buffer.flip().toBuffer();
    }

    private static serializeHeader(block: IBlockData, buffer: ByteBuffer): void {
        const constants = configManager.getMilestone(block.height - 1);

        if (constants.block.idFullSha256) {
            if (block.previousBlock.length !== 64) {
                throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
            }

            block.previousBlockHex = block.previousBlock;
        } else {
            block.previousBlockHex = Block.toBytesHex(block.previousBlock);
        }

        buffer.writeUint32(block.version);
        buffer.writeUint32(block.timestamp);
        buffer.writeUint32(block.height);
        buffer.append(block.previousBlockHex, "hex");
        buffer.writeUint32(block.numberOfTransactions);
        // @TODO: remove the BigNumber.make
        buffer.writeUint64(+BigNumber.make(block.totalAmount).toFixed());
        // @TODO: remove the BigNumber.make
        buffer.writeUint64(+BigNumber.make(block.totalFee).toFixed());
        // @TODO: remove the BigNumber.make
        buffer.writeUint64(+BigNumber.make(block.reward).toFixed());
        buffer.writeUint32(block.payloadLength);
        buffer.append(block.payloadHash, "hex");
        buffer.append(block.generatorPublicKey, "hex");
    }

    private static serializeSignature(block: IBlockData, buffer: ByteBuffer): void {
        if (block.blockSignature) {
            buffer.append(block.blockSignature, "hex");
        }
    }
}
