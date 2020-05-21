import { CryptoManager, Interfaces, Transactions } from "@arkecosystem/crypto";

import { IBlock, IBlockData, IBlockJson } from "../interfaces";
import { Validator } from "../validation";
import { Block } from "./block";
import { Deserializer } from "./deserializer";
import { Serializer } from "./serializer";

export class BlockFactory<T extends IBlockData = IBlockData> {
    public serializer: Serializer;
    public deserializer: Deserializer;

    public constructor(
        public cryptoManager: CryptoManager<T>,
        public transactionManager: Transactions.TransactionManager<T>,
        public validator: Validator,
    ) {
        this.serializer = new Serializer(cryptoManager, transactionManager.TransactionTools);
        this.deserializer = new Deserializer(cryptoManager, transactionManager);
    }

    public make(
        data: IBlockData,
        keys: Interfaces.IKeyPair,
        getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup,
    ): IBlock | undefined {
        data.generatorPublicKey = keys.publicKey;

        const payloadHash: Buffer = this.serializer.serialize(data, false);
        const hash: Buffer = this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(payloadHash);

        data.blockSignature = this.cryptoManager.LibraryManager.Crypto.Hash.signECDSA(hash, keys);
        data.id = this.serializer.getId(data);

        return this.fromData(data, getBlockTimeStampLookup);
    }

    public fromHex(hex: string, getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup): IBlock {
        return this.fromSerialized(hex, getBlockTimeStampLookup);
    }

    public fromBytes(buffer: Buffer, getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup): IBlock {
        return this.fromSerialized(buffer.toString("hex"), getBlockTimeStampLookup);
    }

    public fromJson(json: IBlockJson, getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup): IBlock | undefined {
        // @ts-ignore
        const data: IBlockData = { ...json };
        data.totalAmount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(data.totalAmount);
        data.totalFee = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(data.totalFee);
        data.reward = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(data.reward);

        if (data.transactions) {
            for (const transaction of data.transactions) {
                transaction.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(transaction.amount);
                transaction.fee = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(transaction.fee);
            }
        }

        return this.fromData(data, getBlockTimeStampLookup);
    }

    public fromData(
        data: IBlockData,
        getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup,
        options: { deserializeTransactionsUnchecked?: boolean } = {},
    ): IBlock | undefined {
        const block: IBlockData | undefined = this.validator.applySchema(data);

        if (block) {
            const serialized: string = this.serializer.serializeWithTransactions(data).toString("hex");
            const block: IBlock = new Block(
                {
                    ...this.deserializer.deserialize(serialized, false, options),
                    id: data.id,
                },
                getBlockTimeStampLookup,
                this.cryptoManager,
                this.validator,
                this.serializer,
            );
            block.serialized = serialized;

            return block;
        }

        return undefined;
    }

    private fromSerialized(serialized: string, getBlockTimeStampLookup: Interfaces.GetBlockTimeStampLookup): IBlock {
        const deserialized: {
            data: IBlockData;
            transactions: Interfaces.ITransaction[];
        } = this.deserializer.deserialize(serialized);

        const validated: IBlockData | undefined = this.validator.applySchema(deserialized.data);

        if (validated) {
            deserialized.data = validated;
        }

        const block: IBlock = new Block(
            deserialized,
            getBlockTimeStampLookup,
            this.cryptoManager,
            this.validator,
            this.serializer,
        );
        block.serialized = serialized;

        return block;
    }
}
