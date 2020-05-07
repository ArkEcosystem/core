import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { IBlock, IBlockData } from "../interfaces";
import { SerializerUtils } from "./serialization-utils";

export class Deserializer extends SerializerUtils {
    public constructor(
        cryptoManager: CryptoManager<IBlockData>,
        private transactionManager: Transactions.TransactionsManager<IBlock, Interfaces.ITransactionData>,
    ) {
        super(cryptoManager);
    }

    public deserialize(
        serializedHex: string,
        headerOnly: boolean = false,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): { data: IBlockData; transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[] } {
        const block = {} as IBlockData;
        let transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[] = [];

        const buffer = Buffer.from(serializedHex, "hex");
        const buf: ByteBuffer = new ByteBuffer(buffer.length, true);
        buf.append(buffer);
        buf.reset();

        this.deserializeHeader(block, buf);

        headerOnly = headerOnly || buf.remaining() === 0;
        if (!headerOnly) {
            transactions = this.deserializeTransactions(block, buf, options.deserializeTransactionsUnchecked);
        }

        block.idHex = this.getIdHex(block);
        block.id = this.getId(block);

        const { outlookTable } = this.cryptoManager.NetworkConfigManager.get("exceptions");

        if (outlookTable && outlookTable[block.id]) {
            const constants = this.cryptoManager.MilestoneManager.getMilestone(block.height);

            if (constants.block.idFullSha256) {
                block.id = outlookTable[block.id];
                block.idHex = block.id;
            } else {
                block.id = outlookTable[block.id];
                block.idHex = SerializerUtils.toBytesHex(block.id, this.cryptoManager);
            }
        }

        return { data: block, transactions };
    }

    private deserializeHeader(block: IBlockData, buf: ByteBuffer): void {
        block.version = buf.readUint32();
        block.timestamp = buf.readUint32();
        block.height = buf.readUint32();

        const constants = this.cryptoManager.MilestoneManager.getMilestone(block.height - 1 || 1);

        if (constants.block.idFullSha256) {
            const previousBlockFullSha256 = buf.readBytes(32).toString("hex");
            block.previousBlockHex = previousBlockFullSha256;
            block.previousBlock = previousBlockFullSha256;
        } else {
            block.previousBlockHex = buf.readBytes(8).toString("hex");
            block.previousBlock = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(
                `0x${block.previousBlockHex}`,
            ).toString();
        }

        block.numberOfTransactions = buf.readUint32();
        block.totalAmount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(buf.readUint64().toString());
        block.totalFee = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(buf.readUint64().toString());
        block.reward = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(buf.readUint64().toString());
        block.payloadLength = buf.readUint32();
        block.payloadHash = buf.readBytes(32).toString("hex");
        block.generatorPublicKey = buf.readBytes(33).toString("hex");

        const signatureLength = (): number => {
            buf.mark();

            const lengthHex: string = buf.skip(1).readBytes(1).toString("hex");

            buf.reset();

            return parseInt(lengthHex, 16) + 2;
        };

        block.blockSignature = buf.readBytes(signatureLength()).toString("hex");
    }

    private deserializeTransactions(
        block: IBlockData,
        buf: ByteBuffer,
        deserializeTransactionsUnchecked: boolean = false,
    ): Interfaces.ITransaction<Interfaces.ITransactionData>[] {
        const transactionLengths: number[] = [];

        for (let i = 0; i < block.numberOfTransactions; i++) {
            transactionLengths.push(buf.readUint32());
        }

        const transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[] = [];
        block.transactions = [];
        for (const length of transactionLengths) {
            const transactionBytes = buf.readBytes(length).toBuffer();
            const transaction = deserializeTransactionsUnchecked
                ? this.transactionManager.TransactionFactory.fromBytesUnsafe(transactionBytes)
                : this.transactionManager.TransactionFactory.fromBytes(transactionBytes);
            transactions.push(transaction);
            block.transactions.push(transaction.data);
        }

        return transactions;
    }
}
