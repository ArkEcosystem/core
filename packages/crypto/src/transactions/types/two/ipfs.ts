import { base58 } from "bstring";
import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../../../crypto-manager";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions, SchemaError } from "../../../interfaces";
import { ITransactionData } from "../../../interfaces";
import { Verifier } from "../../verifier";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class IpfsTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Ipfs;
    public static key = "ipfs";
    public static version: number = 2;

    protected static defaultStaticFee: string = "500000000";

    public constructor(protected cryptoManager: CryptoManager<T>, verifier: Verifier<T, U, E>) {
        super(cryptoManager, verifier);
    }

    public static getSchema(): schemas.TransactionSchema {
        return schemas.ipfs;
    }

    public verify(): boolean {
        return this.cryptoManager.MilestoneManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset) {
            const ipfsBuffer: Buffer = base58.decode(data.asset.ipfs);
            const buffer: ByteBuffer = new ByteBuffer(ipfsBuffer.length, true);

            buffer.append(ipfsBuffer, "hex");

            return buffer;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUint8();
        const ipfsHashLength: number = buf.readUint8();
        const ipfsHash: Buffer = buf.readBytes(ipfsHashLength).toBuffer();

        const buffer: Buffer = Buffer.alloc(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);

        data.asset = {
            ipfs: base58.encode(buffer),
        };
    }
}
