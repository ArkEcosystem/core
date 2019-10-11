import { Hash, HashAlgorithms } from "../crypto";
import { IBlock, IBlockData, IBlockJson, IKeyPair, ITransaction } from "../interfaces";
import { BigNumber } from "../utils";
import { Block } from "./block";
import { deserializer } from "./deserializer";

export class BlockFactory {
    // @todo: add a proper type hint for data
    public static make(data: any, keys: IKeyPair): IBlock {
        data.generatorPublicKey = keys.publicKey;

        const payloadHash: Buffer = Block.serialize(data, false);
        const hash: Buffer = HashAlgorithms.sha256(payloadHash);

        data.blockSignature = Hash.signECDSA(hash, keys);
        data.id = Block.getId(data);

        return this.fromData(data);
    }

    public static fromHex(hex: string): IBlock {
        return this.fromSerialized(hex);
    }

    public static fromBytes(buffer: Buffer): IBlock {
        return this.fromSerialized(buffer ? buffer.toString("hex") : undefined);
    }

    public static fromJson(json: IBlockJson): IBlock {
        // @ts-ignore
        const data: IBlockData = { ...json };
        data.totalAmount = BigNumber.make(data.totalAmount);
        data.totalFee = BigNumber.make(data.totalFee);
        data.reward = BigNumber.make(data.reward);

        for (const transaction of data.transactions) {
            transaction.amount = BigNumber.make(transaction.amount);
            transaction.fee = BigNumber.make(transaction.fee);
        }

        return this.fromData(data);
    }

    public static fromData(data: IBlockData, options: { deserializeTransactionsUnchecked?: boolean } = {}): IBlock {
        data = Block.applySchema(data);

        const serialized: string = Block.serializeWithTransactions(data).toString("hex");
        const block: IBlock = new Block({ ...deserializer.deserialize(serialized, false, options), id: data.id });
        block.serialized = serialized;

        return block;
    }

    private static fromSerialized(serialized: string): IBlock {
        const deserialized: { data: IBlockData; transactions: ITransaction[] } = deserializer.deserialize(serialized);
        deserialized.data = Block.applySchema(deserialized.data);

        const block: IBlock = new Block(deserialized);
        block.serialized = serialized;

        return block;
    }
}
