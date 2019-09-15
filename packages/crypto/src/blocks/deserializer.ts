import ByteBuffer from "bytebuffer";
import { IBlockData, ITransaction } from "../interfaces";
import { configManager } from "../managers";
import { TransactionFactory } from "../transactions";
import { BigNumber } from "../utils";
import { Block } from "./block";

class Deserializer {
    public deserialize(
        serializedHex: string,
        headerOnly: boolean = false,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): { data: IBlockData; transactions: ITransaction[] } {
        const block = {} as IBlockData;
        let transactions: ITransaction[] = [];

        const buffer = Buffer.from(serializedHex, "hex");
        const buf: ByteBuffer = new ByteBuffer(buffer.length, true);
        buf.append(buffer);
        buf.reset();

        this.deserializeHeader(block, buf);

        headerOnly = headerOnly || buf.remaining() === 0;
        if (!headerOnly) {
            transactions = this.deserializeTransactions(block, buf, options.deserializeTransactionsUnchecked);
        }

        block.idHex = Block.getIdHex(block);
        block.id = Block.getId(block);

        const { outlookTable } = configManager.get("exceptions");

        if (outlookTable && outlookTable[block.id]) {
            const constants = configManager.getMilestone(block.height);

            if (constants.block.idFullSha256) {
                block.id = outlookTable[block.id];
                block.idHex = block.id;
            } else {
                block.id = outlookTable[block.id];
                block.idHex = Block.toBytesHex(block.id);
            }
        }

        return { data: block, transactions };
    }

    private deserializeHeader(block: IBlockData, buf: ByteBuffer): void {
        block.version = buf.readUint32();
        block.timestamp = buf.readUint32();
        block.height = buf.readUint32();

        const constants = configManager.getMilestone(block.height - 1 || 1);

        if (constants.block.idFullSha256) {
            block.previousBlockHex = buf.readBytes(32).toString("hex");
            block.previousBlock = block.previousBlockHex;
        } else {
            block.previousBlockHex = buf.readBytes(8).toString("hex");
            block.previousBlock = BigNumber.make(block.previousBlockHex, 16).toFixed();
        }

        block.numberOfTransactions = buf.readUint32();
        block.totalAmount = BigNumber.make(buf.readUint64().toString());
        block.totalFee = BigNumber.make(buf.readUint64().toString());
        block.reward = BigNumber.make(buf.readUint64().toString());
        block.payloadLength = buf.readUint32();
        block.payloadHash = buf.readBytes(32).toString("hex");
        block.generatorPublicKey = buf.readBytes(33).toString("hex");

        const signatureLength = (): number => {
            buf.mark();

            const lengthHex: string = buf
                .skip(1)
                .readBytes(1)
                .toString("hex");

            buf.reset();

            return parseInt(lengthHex, 16) + 2;
        };

        block.blockSignature = buf.readBytes(signatureLength()).toString("hex");
    }

    private deserializeTransactions(
        block: IBlockData,
        buf: ByteBuffer,
        deserializeTransactionsUnchecked: boolean = false,
    ): ITransaction[] {
        const transactionLengths = [];

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

export const deserializer = new Deserializer();
