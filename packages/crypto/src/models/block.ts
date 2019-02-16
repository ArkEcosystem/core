import { createHash } from "crypto";
import pluralize from "pluralize";
import { crypto, slots } from "../crypto";
import { BlockDeserializer } from "../deserializers";
import { configManager } from "../managers/config";
import { BlockSerializer } from "../serializers";
import { Bignum } from "../utils";
import { ITransactionData, Transaction } from "./transaction";

export interface BlockVerification {
    verified: boolean;
    errors: string[];
}

export interface IBlock {
    data: IBlockData;
}

export interface IBlockData {
    id?: string;
    idHex?: string;

    timestamp: number;
    version: number;
    height: number;
    previousBlockHex?: string;
    previousBlock: string;
    numberOfTransactions: number;
    totalAmount: Bignum | number | string;
    totalFee: Bignum | number | string;
    reward: Bignum | number | string;
    payloadLength: number;
    payloadHash: string;
    generatorPublicKey: string;

    blockSignature?: string;
    serialized?: string;
    transactions?: ITransactionData[];
}

/**
 * TODO copy some parts to ArkDocs
 * @classdesc This model holds the block data, its verification and serialization
 *
 * A Block model stores on the db:
 *   - id
 *   - version (version of the block: could be used for changing how they are forged)
 *   - timestamp (related to the genesis block)
 *   - previousBlock (id of the previous block)
 *   - height
 *   - numberOfTransactions
 *   - totalAmount (in satoshi)
 *   - totalFee (in satoshi)
 *   - reward (in satoshi)
 *   - payloadHash (hash of the transactions)
 *   - payloadLength (total length in bytes of the IDs of the transactions)
 *   - generatorPublicKey (public key of the delegate that forged this block)
 *   - blockSignature
 *
 * The `transactions` are stored too, but in a different table.
 *
 * These data is exposed through the `data` attributed as a plain object and
 * serialized through the `serialized` attribute.
 *
 * In the future the IDs could be changed to use the hexadecimal version of them,
 * which would be more efficient for performance, disk usage and bandwidth reasons.
 * That is why there are some attributes, such as `idHex` and `previousBlockHex`.
 */

export class Block implements IBlock {
    /**
     * Create block from data.
     */
    public static create(data, keys): Block {
        data.generatorPublicKey = keys.publicKey;

        const payloadHash: Buffer = Block.serialize(data, false);
        const hash = createHash("sha256")
            .update(payloadHash)
            .digest();

        data.blockSignature = crypto.signHash(hash, keys);
        data.id = Block.getId(data);

        return new Block(data);
    }

    /**
     * Deserialize block from hex string.
     */
    public static deserialize(hexString, headerOnly = false): IBlockData {
        return BlockDeserializer.deserialize(hexString, headerOnly);
    }

    /**
     * Serialize the given block including transactions.
     */
    public static serializeFull(block: IBlockData) {
        return BlockSerializer.serializeFull(block);
    }

    /**
     * Serialize the given block without transactions.
     */
    public static serialize(block: IBlockData, includeSignature: boolean = true) {
        return BlockSerializer.serialize(block, includeSignature);
    }

    public static getIdHex(data): string {
        const payloadHash: any = Block.serialize(data);
        const hash = createHash("sha256")
            .update(payloadHash)
            .digest();
        const temp = Buffer.alloc(8);

        for (let i = 0; i < 8; i++) {
            temp[i] = hash[7 - i];
        }
        return temp.toString("hex");
    }

    public static toBytesHex(data): string {
        const temp = data ? new Bignum(data).toString(16) : "";
        return "0".repeat(16 - temp.length) + temp;
    }

    /**
     * Get block id from already serialized buffer
     */
    public static getIdFromSerialized(serializedBuffer: Buffer): string {
        const hash = createHash("sha256")
            .update(serializedBuffer)
            .digest();
        const temp = Buffer.alloc(8);

        for (let i = 0; i < 8; i++) {
            temp[i] = hash[7 - i];
        }
        return new Bignum(temp.toString("hex"), 16).toFixed();
    }

    public static getId(data): string {
        const idHex = Block.getIdHex(data);
        return new Bignum(idHex, 16).toFixed();
    }

    public serialized: string;
    public data: IBlockData;
    public transactions: Transaction[];
    public verification: BlockVerification;

    constructor(data: IBlockData | string) {
        if (typeof data === "string") {
            data = Block.deserialize(data);
        }

        this.serialized = Block.serializeFull(data).toString("hex");
        this.data = Block.deserialize(this.serialized);

        // TODO genesis block calculated id is wrong for some reason
        if (data.height === 1) {
            this.applyGenesisBlockFix(data);
        }

        // fix on real timestamp, this is overloading transaction
        // timestamp with block timestamp for storage only
        // also add sequence to keep database sequence
        const { transactions } = this.data;
        this.transactions = transactions
            ? transactions.map((transaction, index) => {
                  transaction.blockId = this.data.id;
                  transaction.timestamp = this.data.timestamp;
                  transaction.sequence = index;
                  return transaction as Transaction;
              })
            : [];

        delete this.data.transactions;

        this.verification = this.verify();

        // order of transactions messed up in mainnet V1
        // TODO: move this to network constants exception using block ids
        if (
            this.transactions &&
            this.data.numberOfTransactions === 2 &&
            (this.data.height === 3084276 || this.data.height === 34420)
        ) {
            const temp = this.transactions[0];
            this.transactions[0] = this.transactions[1];
            this.transactions[1] = temp;
        }
    }

    /**
     * Return block as string.
     */
    public toString(): string {
        return `${this.data.id}, height: ${this.data.height.toLocaleString()}, ${pluralize(
            "transaction",
            this.data.numberOfTransactions,
            true,
        )}, verified: ${this.verification.verified}, errors: ${this.verification.errors}`;
    }

    /**
     * Get header from block.
     */
    public getHeader(): IBlockData {
        const header = Object.assign({}, this.data);
        delete header.transactions;
        return header;
    }

    /**
     * Verify signature associated with this block.
     */
    public verifySignature(): boolean {
        const bytes: any = Block.serialize(this.data, false);
        const hash = createHash("sha256")
            .update(bytes)
            .digest();

        return crypto.verifyHash(hash, this.data.blockSignature, this.data.generatorPublicKey);
    }

    public toJson(): any {
        const blockData = Object.assign({}, this.data) as IBlockData;
        ["reward", "totalAmount", "totalFee"].forEach((key: string) => {
            blockData[key] = +(blockData[key] as Bignum).toFixed();
        });

        blockData.transactions = this.transactions.map(transaction => transaction.toJson());
        return blockData;
    }

    /**
     * Verify this block.
     */
    private verify(): BlockVerification {
        const block = this.data;
        const result: BlockVerification = {
            verified: false,
            errors: [],
        };

        try {
            const constants = configManager.getMilestone(block.height);

            if (block.height !== 1) {
                if (!block.previousBlock) {
                    result.errors.push("Invalid previous block");
                }
            }

            if (!(block.reward as Bignum).isEqualTo(constants.reward)) {
                result.errors.push(["Invalid block reward:", block.reward, "expected:", constants.reward].join(" "));
            }

            const valid = this.verifySignature();

            if (!valid) {
                result.errors.push("Failed to verify block signature");
            }

            if (block.version !== constants.block.version) {
                result.errors.push("Invalid block version");
            }

            if (slots.getSlotNumber(block.timestamp) > slots.getSlotNumber()) {
                result.errors.push("Invalid block timestamp");
            }

            // Disabling to allow orphanedBlocks?
            // if(previousBlock){
            //   const lastBlockSlotNumber = slots.getSlotNumber(previousBlock.timestamp)
            //   if(blockSlotNumber < lastBlockSlotNumber) {
            //      result.errors.push('block timestamp is smaller than previous block timestamp')
            //   }
            // }

            let size = 0;
            const payloadHash = createHash("sha256");
            const invalidTransactions = this.transactions.filter(tx => !tx.verified);
            if (invalidTransactions.length > 0) {
                result.errors.push("One or more transactions are not verified:");
                invalidTransactions.forEach(tx => result.errors.push(`=> ${tx.serialized}`));
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
            const appliedTransactions = {};
            let totalAmount = Bignum.ZERO;
            let totalFee = Bignum.ZERO;
            this.transactions.forEach(transaction => {
                const bytes = Buffer.from(transaction.data.id, "hex");

                if (appliedTransactions[transaction.data.id]) {
                    result.errors.push(`Encountered duplicate transaction: ${transaction.data.id}`);
                }

                appliedTransactions[transaction.data.id] = transaction.data;

                totalAmount = totalAmount.plus(transaction.data.amount);
                totalFee = totalFee.plus(transaction.data.fee);
                size += bytes.length;

                payloadHash.update(bytes);
            });

            if (!totalAmount.isEqualTo(block.totalAmount)) {
                result.errors.push("Invalid total amount");
            }

            if (!totalFee.isEqualTo(block.totalFee)) {
                result.errors.push("Invalid total fee");
            }

            if (size > constants.block.maxPayload) {
                result.errors.push("Payload is too large");
            }

            if (payloadHash.digest().toString("hex") !== block.payloadHash) {
                result.errors.push("Invalid payload hash");
            }
        } catch (error) {
            result.errors.push(error);
        }

        result.verified = result.errors.length === 0;

        return result;
    }

    private applyGenesisBlockFix(data: IBlockData): void {
        this.data.id = data.id;
        this.data.idHex = Block.toBytesHex(this.data.id);
        delete this.data.previousBlock;
    }
}
