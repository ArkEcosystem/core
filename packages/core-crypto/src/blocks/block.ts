import { CryptoManager, Interfaces, Types } from "@arkecosystem/crypto";

import { IBlock, IBlockData, IBlockJson, IBlockVerification } from "../interfaces";
import { Validator } from "../validation";
import { Serializer } from "./serializer";

export class Block implements IBlock {
    // @ts-ignore - todo: this is public but not initialised on creation, either make it private or declare it as undefined
    public serialized: string;
    public data: IBlockData;
    public transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[];
    public verification: IBlockVerification;

    public constructor(
        {
            data,
            transactions,
            id,
        }: {
            data: IBlockData;
            transactions: Interfaces.ITransaction<Interfaces.ITransactionData>[];
            id?: string;
        },
        private cryptoManager: CryptoManager<IBlockData>,
        private validator: Validator,
        private serializer: Serializer,
    ) {
        this.data = data;

        // TODO genesis block calculated id is wrong for some reason
        if (this.data.height === 1) {
            if (id) {
                this.applyGenesisBlockFix(id);
            } else if (data.id) {
                this.applyGenesisBlockFix(data.id);
            }
        }

        // fix on real timestamp, this is overloading transaction
        // timestamp with block timestamp for storage only
        // also add sequence to keep database sequence
        this.transactions = transactions.map((transaction, index) => {
            transaction.data.blockId = this.data.id;
            transaction.timestamp = this.data.timestamp;
            transaction.data.sequence = index;
            return transaction;
        });

        delete this.data.transactions;

        this.verification = this.verify();

        // Order of transactions messed up in mainnet V1
        const { wrongTransactionOrder } = this.cryptoManager.NetworkConfigManager.get("exceptions");
        if (this.data.id && wrongTransactionOrder && wrongTransactionOrder[this.data.id]) {
            const fixedOrderIds = wrongTransactionOrder[this.data.id];

            this.transactions = fixedOrderIds.map((id: string) =>
                this.transactions.find((transaction) => transaction.id === id),
            );
        }
    }

    public applySchema(data: IBlockData): IBlockData | undefined {
        return this.validator.applySchema(data);
    }

    public getHeader(): IBlockData {
        const header: IBlockData = Object.assign({}, this.data);
        delete header.transactions;

        return header;
    }

    public verifySignature(): boolean {
        const bytes: Buffer = this.serializer.serialize(this.data, false);
        const hash: Buffer = this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(bytes);

        if (!this.data.blockSignature) {
            throw new Error();
        }

        return this.cryptoManager.LibraryManager.Crypto.Hash.verifyECDSA(
            hash,
            this.data.blockSignature,
            this.data.generatorPublicKey,
        );
    }

    public toJson(): IBlockJson {
        const data: IBlockJson = JSON.parse(JSON.stringify(this.data));
        data.reward = this.data.reward.toString();
        data.totalAmount = this.data.totalAmount.toString();
        data.totalFee = this.data.totalFee.toString();
        data.transactions = this.transactions.map((transaction) => transaction.toJson());

        return data;
    }

    public verify(): IBlockVerification {
        const block: IBlockData = this.data;
        const result: IBlockVerification = {
            verified: false,
            containsMultiSignatures: false,
            errors: [],
        };

        try {
            const constants = this.cryptoManager.MilestoneManager.getMilestone(block.height);

            if (block.height !== 1) {
                if (!block.previousBlock) {
                    result.errors.push("Invalid previous block");
                }
            }

            if (!block.reward.isEqualTo(constants.reward)) {
                result.errors.push(["Invalid block reward:", block.reward, "expected:", constants.reward].join(" "));
            }

            const valid = this.verifySignature();

            if (!valid) {
                result.errors.push("Failed to verify block signature");
            }

            if (block.version !== constants.block.version) {
                result.errors.push("Invalid block version");
            }

            if (
                this.cryptoManager.LibraryManager.Crypto.Slots.getSlotNumber(block.timestamp) >
                this.cryptoManager.LibraryManager.Crypto.Slots.getSlotNumber()
            ) {
                result.errors.push("Invalid block timestamp");
            }

            const size: number = this.serializer.size(this);
            if (size > constants.block.maxPayload) {
                result.errors.push(`Payload is too large: ${size} > ${constants.block.maxPayload}`);
            }

            const invalidTransactions: Interfaces.ITransaction<
                Interfaces.ITransactionData
            >[] = this.transactions.filter((tx) => !tx.verified);
            if (invalidTransactions.length > 0) {
                result.errors.push("One or more transactions are not verified:");

                for (const invalidTransaction of invalidTransactions) {
                    result.errors.push(`=> ${invalidTransaction.serialized.toString("hex")}`);
                }

                result.containsMultiSignatures = invalidTransactions.some((tx) => !!tx.data.signatures);
            }

            if (this.transactions.length !== block.numberOfTransactions) {
                result.errors.push("Invalid number of transactions");
            }

            if (this.transactions.length > constants.block.maxTransactions) {
                if (block.height > 1) {
                    result.errors.push("Transactions length is too high");
                }
            }

            // Checking if transactions of the block adds up to block values.
            const appliedTransactions: Record<string, Interfaces.ITransactionData> = {};

            let totalAmount: Types.BigNumber = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
            let totalFee: Types.BigNumber = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;

            const payloadBuffers: Buffer[] = [];
            for (const transaction of this.transactions) {
                if (!transaction.data || !transaction.data.id) {
                    throw new Error();
                }

                const bytes: Buffer = Buffer.from(transaction.data.id, "hex");

                if (appliedTransactions[transaction.data.id]) {
                    result.errors.push(`Encountered duplicate transaction: ${transaction.data.id}`);
                }

                if (
                    transaction.data.expiration &&
                    transaction.data.expiration > 0 &&
                    transaction.data.expiration <= this.data.height
                ) {
                    const isException =
                        this.cryptoManager.NetworkConfigManager.get("network.name") === "devnet" &&
                        constants.ignoreExpiredTransactions;
                    if (!isException) {
                        result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                    }
                }

                if (transaction.data.version === 1 && !constants.block.acceptExpiredTransactionTimestamps) {
                    const now: number = block.timestamp;
                    if (transaction.data.timestamp > now + 3600 + constants.blocktime) {
                        result.errors.push(`Encountered future transaction: ${transaction.data.id}`);
                    } else if (now - transaction.data.timestamp > 21600) {
                        result.errors.push(`Encountered expired transaction: ${transaction.data.id}`);
                    }
                }

                appliedTransactions[transaction.data.id] = transaction.data;

                totalAmount = totalAmount.plus(transaction.data.amount);
                totalFee = totalFee.plus(transaction.data.fee);

                payloadBuffers.push(bytes);
            }

            if (!totalAmount.isEqualTo(block.totalAmount)) {
                result.errors.push("Invalid total amount");
            }

            if (!totalFee.isEqualTo(block.totalFee)) {
                result.errors.push("Invalid total fee");
            }

            if (
                this.cryptoManager.LibraryManager.Crypto.HashAlgorithms.sha256(payloadBuffers).toString("hex") !==
                block.payloadHash
            ) {
                result.errors.push("Invalid payload hash");
            }
        } catch (error) {
            result.errors.push(error);
        }

        result.verified = result.errors.length === 0;

        return result;
    }

    private applyGenesisBlockFix(id: string): void {
        this.data.id = id;
        this.data.idHex = Serializer.toBytesHex(id, this.cryptoManager);
    }
}
