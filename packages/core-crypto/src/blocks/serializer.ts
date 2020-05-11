import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import { IBlock, IBlockData } from "../interfaces";
import { SerializerUtils } from "./serialization-utils";

export class Serializer<T extends IBlockData = IBlockData> extends SerializerUtils {
    public constructor(
        cryptoManager: CryptoManager<T>,
        private transactionManager: Transactions.TransactionsManager<T>,
    ) {
        super(cryptoManager);
    }

    public size(block: IBlock): number {
        let size = this.headerSize(block.data) + block.data.blockSignature!.length / 2;

        for (const transaction of block.transactions) {
            size += 4 /* tx length */ + transaction.serialized.length;
        }

        return size;
    }

    public serializeWithTransactions(block: T): Buffer {
        const transactions: Interfaces.ITransactionData[] = block.transactions || [];
        block.numberOfTransactions = block.numberOfTransactions || transactions.length;

        const serializedHeader: Buffer = this.serialize(block);

        const buffer: ByteBuffer = new ByteBuffer(serializedHeader.length + transactions.length * 4, true)
            .append(serializedHeader)
            .skip(transactions.length * 4);

        for (let i = 0; i < transactions.length; i++) {
            const serialized: Buffer = this.transactionManager.Utils.toBytes(transactions[i]);
            buffer.writeUint32(serialized.length, serializedHeader.length + i * 4);
            buffer.append(serialized);
        }

        return buffer.flip().toBuffer();
    }
}
