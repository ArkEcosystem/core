import { Hash, HashAlgorithms, Slots } from "../crypto";
import { BlockSchemaError } from "../errors";
import { IBlock, IBlockData, IBlockJson, IBlockVerification, ITransaction, ITransactionData } from "../interfaces";
import { configManager } from "../managers/config";
import { BigNumber, isException } from "../utils";
import { validator } from "../validation";
import { deserializer } from "./deserializer";
import { Serializer } from "./serializer";

export class Block implements IBlock {
    public static applySchema(data: IBlockData): IBlockData {
        const { value, error } = validator.validate("block", data);

        if (
            error &&
            !(isException(value) || data.transactions.some((transaction: ITransactionData) => isException(transaction)))
        ) {
            throw new BlockSchemaError(data.height, error);
        }

        return value;
    }

    public static deserialize(hexString: string, headerOnly = false): IBlockData {
        return deserializer.deserialize(hexString, headerOnly).data;
    }

    public static serializeWithTransactions(block: IBlockData) {
        return Serializer.serializeWithTransactions(block);
    }

    public static serialize(block: IBlockData, includeSignature = true) {
        return Serializer.serialize(block, includeSignature);
    }

    public static getIdHex(data: IBlockData): string {
        const constants = configManager.getMilestone(data.height);
        const payloadHash: Buffer = Block.serialize(data);

        const hash: Buffer = HashAlgorithms.sha256(payloadHash);

        if (constants.block.idFullSha256) {
            return hash.toString("hex");
        }

        const temp: Buffer = Buffer.alloc(8);

        for (let i = 0; i < 8; i++) {
            temp[i] = hash[7 - i];
        }

        return temp.toString("hex");
    }

    public static toBytesHex(data): string {
        const temp: string = data ? BigNumber.make(data).toString(16) : "";

        return "0".repeat(16 - temp.length) + temp;
    }

    public static getId(data: IBlockData): string {
        const constants = configManager.getMilestone(data.height);
        const idHex: string = Block.getIdHex(data);

        return constants.block.idFullSha256 ? idHex : BigNumber.make(idHex, 16).toFixed();
    }

    public serialized: string;
    public data: IBlockData;
    public transactions: ITransaction[];
    public verification: IBlockVerification;

    public constructor({ data, transactions, id }: { data: IBlockData; transactions: ITransaction[]; id?: string }) {
        this.data = data;

        // TODO genesis block calculated id is wrong for some reason
        if (this.data.height === 1) {
            this.applyGenesisBlockFix(id || data.id);
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
        const { wrongTransactionOrder } = configManager.get("exceptions");
        if (wrongTransactionOrder && wrongTransactionOrder[this.data.id]) {
            const fixedOrderIds = wrongTransactionOrder[this.data.id];

            this.transactions = fixedOrderIds.map((id: string) =>
                this.transactions.find(transaction => transaction.id === id),
            );
        }
    }

    public getHeader(): IBlockData {
        const header: IBlockData = Object.assign({}, this.data);
        delete header.transactions;

        return header;
    }

    public verifySignature(): boolean {
        const bytes: Buffer = Block.serialize(this.data, false);
        const hash: Buffer = HashAlgorithms.sha256(bytes);

        return Hash.verifyECDSA(hash, this.data.blockSignature, this.data.generatorPublicKey);
    }

    public toJson(): IBlockJson {
        const data: IBlockJson = JSON.parse(JSON.stringify(this.data));
        data.reward = this.data.reward.toFixed();
        data.totalAmount = this.data.totalAmount.toFixed();
        data.totalFee = this.data.totalFee.toFixed();
        data.transactions = this.transactions.map(transaction => transaction.toJson());

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
            const constants = configManager.getMilestone(block.height);

            if (block.height !== 1) {
                if (!block.previousBlock) {
                    result.errors.push("Invalid previous block");
                }
            }

            if (!(block.reward as BigNumber).isEqualTo(constants.reward)) {
                result.errors.push(["Invalid block reward:", block.reward, "expected:", constants.reward].join(" "));
            }

            const valid = this.verifySignature();

            if (!valid) {
                result.errors.push("Failed to verify block signature");
            }

            if (block.version !== constants.block.version) {
                result.errors.push("Invalid block version");
            }

            if (Slots.getSlotNumber(block.timestamp) > Slots.getSlotNumber()) {
                result.errors.push("Invalid block timestamp");
            }

            let size = 0;
            const invalidTransactions: ITransaction[] = this.transactions.filter(tx => !tx.verified);
            if (invalidTransactions.length > 0) {
                result.errors.push("One or more transactions are not verified:");

                for (const invalidTransaction of invalidTransactions) {
                    result.errors.push(`=> ${invalidTransaction.serialized.toString("hex")}`);
                }

                result.containsMultiSignatures = invalidTransactions.some(tx => !!tx.data.signatures);
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
            const appliedTransactions: Record<string, ITransactionData> = {};

            let totalAmount: BigNumber = BigNumber.ZERO;
            let totalFee: BigNumber = BigNumber.ZERO;

            const payloadBuffers: Buffer[] = [];
            for (const transaction of this.transactions) {
                const bytes: Buffer = Buffer.from(transaction.data.id, "hex");

                if (appliedTransactions[transaction.data.id]) {
                    result.errors.push(`Encountered duplicate transaction: ${transaction.data.id}`);
                }

                if (transaction.data.expiration > 0 && transaction.data.expiration <= this.data.height) {
                    const isException =
                        configManager.get("network.name") === "devnet" && constants.ignoreExpiredTransactions;
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
                size += bytes.length;

                payloadBuffers.push(bytes);
            }

            if (!totalAmount.isEqualTo(block.totalAmount)) {
                result.errors.push("Invalid total amount");
            }

            if (!totalFee.isEqualTo(block.totalFee)) {
                result.errors.push("Invalid total fee");
            }

            if (size > constants.block.maxPayload) {
                result.errors.push("Payload is too large");
            }

            if (HashAlgorithms.sha256(payloadBuffers).toString("hex") !== block.payloadHash) {
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
        this.data.idHex = Block.toBytesHex(id);
    }
}
