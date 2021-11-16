import { Hash } from "../crypto";
import { IBlock, IBlockData, IBlockJson, IKeyPair, ITransactionData } from "../interfaces";
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
        const id: string = Serializer.getId({ ...data, generatorPublicKey, blockSignature });

        return this.fromData({ id, ...data, generatorPublicKey, blockSignature });
    }

    public static fromHex(hex: string): IBlock {
        return this.fromSerialized(Buffer.from(hex, "hex"));
    }

    public static fromBytes(buffer: Buffer): IBlock {
        return this.fromSerialized(buffer);
    }

    public static fromJson(json: IBlockJson): IBlock | undefined {
        const data = {
            ...json,

            totalAmount: BigNumber.make(json.totalAmount),
            totalFee: BigNumber.make(json.totalFee),
            reward: BigNumber.make(json.reward),

            transactions: json.transactions?.map((tx) => {
                return {
                    ...tx,
                    nonce: tx.nonce ? BigNumber.make(tx.nonce) : undefined,
                    amount: BigNumber.make(tx.amount),
                    fee: BigNumber.make(tx.fee),
                } as ITransactionData;
            }),
        } as IBlockData;

        return this.fromData(data);
    }

    public static fromData(
        data: IBlockData,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): IBlock | undefined {
        const data2: IBlockData | undefined = Block.applySchema(data);

        if (data2) {
            const serialized: Buffer = Serializer.serialize(data2);
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
