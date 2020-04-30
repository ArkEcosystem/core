import { GetBlockTimeStampLookup, Hash, HashAlgorithms } from "../crypto";
import { IBlock, IBlockData, IBlockJson, IKeyPair, ITransaction } from "../interfaces";
import { BigNumber } from "../utils";
import { Block } from "./block";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";

export class BlockFactory {
    // @todo: add a proper type hint for data
    public static make(
        data: any,
        keys: IKeyPair,
        getBlockTimeStampLookup: GetBlockTimeStampLookup,
    ): IBlock | undefined {
        data.generatorPublicKey = keys.publicKey;

        const payloadHash: Buffer = Serializer.serialize(data, false);
        const hash: Buffer = HashAlgorithms.sha256(payloadHash);

        data.blockSignature = Hash.signECDSA(hash, keys);
        data.id = Block.getId(data);

        return this.fromData(data, getBlockTimeStampLookup);
    }

    public static fromHex(hex: string, getBlockTimeStampLookup: GetBlockTimeStampLookup): IBlock {
        return this.fromSerialized(hex, getBlockTimeStampLookup);
    }

    public static fromBytes(buffer: Buffer, getBlockTimeStampLookup: GetBlockTimeStampLookup): IBlock {
        return this.fromSerialized(buffer.toString("hex"), getBlockTimeStampLookup);
    }

    public static fromJson(json: IBlockJson, getBlockTimeStampLookup: GetBlockTimeStampLookup): IBlock | undefined {
        // @ts-ignore
        const data: IBlockData = { ...json };
        data.totalAmount = BigNumber.make(data.totalAmount);
        data.totalFee = BigNumber.make(data.totalFee);
        data.reward = BigNumber.make(data.reward);

        if (data.transactions) {
            for (const transaction of data.transactions) {
                transaction.amount = BigNumber.make(transaction.amount);
                transaction.fee = BigNumber.make(transaction.fee);
            }
        }

        return this.fromData(data, getBlockTimeStampLookup);
    }

    public static fromData(
        data: IBlockData,
        getBlockTimeStampLookup: GetBlockTimeStampLookup,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): IBlock | undefined {
        const block: IBlockData | undefined = Block.applySchema(data);

        if (block) {
            const serialized: string = Serializer.serializeWithTransactions(data).toString("hex");
            const block: IBlock = new Block(
                {
                    ...Deserializer.deserialize(serialized, false, options),
                    id: data.id,
                },
                getBlockTimeStampLookup,
            );
            block.serialized = serialized;

            return block;
        }

        return undefined;
    }

    private static fromSerialized(serialized: string, getBlockTimeStampLookup: GetBlockTimeStampLookup): IBlock {
        const deserialized: { data: IBlockData; transactions: ITransaction[] } = Deserializer.deserialize(serialized);

        const validated: IBlockData | undefined = Block.applySchema(deserialized.data);

        if (validated) {
            deserialized.data = validated;
        }

        const block: IBlock = new Block(deserialized, getBlockTimeStampLookup);
        block.serialized = serialized;

        return block;
    }
}
