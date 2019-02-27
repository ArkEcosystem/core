import ByteBuffer from "bytebuffer";
import { Block, IBlockData } from "../../models/block";
import { Bignum } from "../../utils";
import { Transaction } from "../types";

class BlockSerializer {
    public serializeFull(block: IBlockData): Buffer {
        const transactions = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;

        const serializedHeader = this.serialize(block);

        const buffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);

        for (let i = 0; i < transactions.length; i++) {
            const serialized = Transaction.toBytes(transactions[i]);
            buffer.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buffer.append(serialized);
        }

        return Buffer.from(buffer.flip().toBuffer());
    }

    public serialize(block: IBlockData, includeSignature: boolean = true): Buffer {
        const buffer = new ByteBuffer(512, true);

        this.serializeHeader(block, buffer);

        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }

        return Buffer.from(buffer.flip().toBuffer());
    }

    private serializeHeader(block: IBlockData, buffer: ByteBuffer): any {
        block.previousBlockHex = Block.toBytesHex(block.previousBlock);

        buffer.writeUint32(block.version);
        buffer.writeUint32(block.timestamp);
        buffer.writeUint32(block.height);
        buffer.append(block.previousBlockHex, "hex");
        buffer.writeUint32(block.numberOfTransactions);
        buffer.writeUint64(+new Bignum(block.totalAmount).toFixed());
        buffer.writeUint64(+new Bignum(block.totalFee).toFixed());
        buffer.writeUint64(+new Bignum(block.reward).toFixed());
        buffer.writeUint32(block.payloadLength);
        buffer.append(block.payloadHash, "hex");
        buffer.append(block.generatorPublicKey, "hex");
    }

    private serializeSignature(block: IBlockData, buffer: ByteBuffer): any {
        if (block.blockSignature) {
            buffer.append(block.blockSignature, "hex");
        }
    }
}

export const blockSerializer = new BlockSerializer();
