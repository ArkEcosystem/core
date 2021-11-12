import { Hash } from "../crypto";
import { IBlock, IBlockData, IBlockJson, IKeyPair } from "../interfaces";
import { BigNumber } from "../utils";
import { Block } from "./block";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";

export class BlockFactory {
    // @todo: add a proper type hint for data
    public static make(data: any, keys: IKeyPair): IBlock | undefined {
        const generatorPublicKey: string = keys.publicKey;
        const signedHash: Buffer = Serializer.getSignedHash({ ...data, generatorPublicKey });
        const blockSignature: string = Hash.signECDSA(signedHash, keys);

        return this.fromData({ ...data, generatorPublicKey, blockSignature });
    }

    public static fromHex(hex: string): IBlock {
        return this.fromSerialized(Buffer.from(hex, "hex"));
    }

    public static fromBytes(buffer: Buffer): IBlock {
        return this.fromSerialized(buffer);
    }

    public static fromJson(json: IBlockJson): IBlock | undefined {
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

        return this.fromData(data);
    }

    public static fromData(
        data: IBlockData,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): IBlock | undefined {
        const block: IBlockData | undefined = Block.applySchema(data);

        if (block) {
            const serialized: Buffer = Serializer.serialize(data);
            const deserialized = Deserializer.deserialize(serialized, false, options);
            const block: IBlock = new Block(deserialized.data, deserialized.transactions);

            return block;
        }

        return undefined;
    }

    private static fromSerialized(serialized: Buffer): IBlock {
        const deserialized = Deserializer.deserialize(serialized);

        const validated: IBlockData | undefined = Block.applySchema(deserialized.data);

        if (validated) {
            deserialized.data = validated;
        }

        const block: IBlock = new Block(deserialized.data, deserialized.transactions);

        return block;
    }
}
