import { CryptoManager } from "@arkecosystem/crypto";
import assert from "assert";
import ByteBuffer from "bytebuffer";

import { PreviousBlockIdFormatError } from "../errors";
import { IBlockData } from "../interfaces";

export abstract class SerializerUtils {
    public constructor(protected cryptoManager: CryptoManager<IBlockData>) {}

    public static toBytesHex(data, cryptoManager: CryptoManager<IBlockData>): string {
        const temp: string = data ? cryptoManager.LibraryManager.Libraries.BigNumber.make(data).toString(16) : "";

        return "0".repeat(16 - temp.length) + temp;
    }

    public getIdHex(data: IBlockData): string {
        const constants = this.cryptoManager.MilestoneManager.getMilestone(data.height);
        const payloadHash: Buffer = this.serialize(data);

        const hash: Buffer = this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(payloadHash);

        if (constants.block.idFullSha256) {
            return hash.toString("hex");
        }

        const temp: Buffer = Buffer.alloc(8);

        for (let i = 0; i < 8; i++) {
            temp[i] = hash[7 - i];
        }

        return temp.toString("hex");
    }

    public getId(data: IBlockData): string {
        const constants = this.cryptoManager.MilestoneManager.getMilestone(data.height);
        const idHex: string = this.getIdHex(data);

        return constants.block.idFullSha256
            ? idHex
            : this.cryptoManager.LibraryManager.Libraries.BigNumber.make(`0x${idHex}`).toString();
    }

    public serialize(block: IBlockData, includeSignature = true): Buffer {
        const buffer: ByteBuffer = new ByteBuffer(512, true);

        this.serializeHeader(block, buffer);

        if (includeSignature) {
            this.serializeSignature(block, buffer);
        }

        return buffer.flip().toBuffer();
    }

    protected serializeHeader(block: IBlockData, buffer: ByteBuffer): void {
        const constants = this.cryptoManager.MilestoneManager.getMilestone(block.height - 1 || 1);

        if (constants.block.idFullSha256) {
            if (block.previousBlock.length !== 64) {
                throw new PreviousBlockIdFormatError(block.height, block.previousBlock);
            }

            block.previousBlockHex = block.previousBlock;
        } else {
            block.previousBlockHex = SerializerUtils.toBytesHex(block.previousBlock, this.cryptoManager);
        }

        buffer.writeUint32(block.version);
        buffer.writeUint32(block.timestamp);
        buffer.writeUint32(block.height);
        buffer.append(block.previousBlockHex, "hex");
        buffer.writeUint32(block.numberOfTransactions);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalAmount.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.totalFee.toString());
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(block.reward.toString());
        buffer.writeUint32(block.payloadLength);
        buffer.append(block.payloadHash, "hex");
        buffer.append(block.generatorPublicKey, "hex");

        assert.strictEqual(buffer.offset, this.headerSize(block));
    }

    protected headerSize(block: IBlockData): number {
        const constants = this.cryptoManager.MilestoneManager.getMilestone(block.height - 1 || 1);

        return (
            4 + // version
            4 + // timestamp
            4 + // height
            (constants.block.idFullSha256 ? 32 : 8) + // previousBlock
            4 + // numberOfTransactions
            8 + // totalAmount
            8 + // totalFee
            8 + // reward
            4 + // payloadLength
            block.payloadHash.length / 2 +
            block.generatorPublicKey.length / 2
        );
    }

    protected serializeSignature(block: IBlockData, buffer: ByteBuffer): void {
        if (block.blockSignature) {
            buffer.append(block.blockSignature, "hex");
        }
    }
}
