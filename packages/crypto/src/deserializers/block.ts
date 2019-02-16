import ByteBuffer from "bytebuffer";
import { configManager } from "../managers";
import { Transaction } from "../models";
import { Block, IBlockData } from "../models/block";
import { Bignum } from "../utils";

const { outlookTable } = configManager.getPreset("mainnet").exceptions;

class BlockDeserializer {
    public deserialize(serializedHex: string, headerOnly: boolean = false): IBlockData {
        const block = {} as IBlockData;
        const buf = ByteBuffer.fromHex(serializedHex, true);

        this.deserializeHeader(block, buf);

        headerOnly = headerOnly || buf.remaining() === 0;
        if (!headerOnly) {
            this.deserializeTransactions(block, buf);
        }

        block.idHex = Block.getIdHex(block);
        block.id = new Bignum(block.idHex, 16).toFixed();

        if (outlookTable[block.id]) {
            block.id = outlookTable[block.id];
            block.idHex = Block.toBytesHex(block.id);
        }

        return block;
    }

    private deserializeHeader(block: IBlockData, buf: ByteBuffer): void {
        block.version = buf.readUint32();
        block.timestamp = buf.readUint32();
        block.height = buf.readUint32();
        block.previousBlockHex = buf.readBytes(8).toString("hex");
        block.previousBlock = new Bignum(block.previousBlockHex, 16).toFixed();
        block.numberOfTransactions = buf.readUint32();
        block.totalAmount = new Bignum(buf.readUint64().toString());
        block.totalFee = new Bignum(buf.readUint64().toString());
        block.reward = new Bignum(buf.readUint64().toString());
        block.payloadLength = buf.readUint32();
        block.payloadHash = buf.readBytes(32).toString("hex");
        block.generatorPublicKey = buf.readBytes(33).toString("hex");

        const signatureLength = (): number => {
            buf.mark();
            const lengthHex = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");
            buf.reset();

            return parseInt(lengthHex, 16) + 2;
        };

        block.blockSignature = buf.readBytes(signatureLength()).toString("hex");
    }

    private deserializeTransactions(block: IBlockData, buf: ByteBuffer): any {
        const transactionLengths = [];

        for (let i = 0; i < block.numberOfTransactions; i++) {
            transactionLengths.push(buf.readUint32());
        }

        block.transactions = [];
        transactionLengths.forEach(length => {
            const serializedHex = buf.readBytes(length).toString("hex");
            const transaction = new Transaction(serializedHex);
            block.transactions.push(transaction);
        });
    }
}

export const blockDeserializer = new BlockDeserializer();
