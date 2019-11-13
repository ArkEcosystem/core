import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBridgechainPorts, IBridgechainUpdateAsset } from "../interfaces";
import { portsSchema, seedNodesSchema } from "./utils/bridgechain-schemas";

const { schemas } = Transactions;

export class BridgechainUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type = MagistrateTransactionType.BridgechainUpdate;
    public static key: string = "bridgechainUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainUpdate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BridgechainUpdate },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["bridgechainUpdate"],
                    properties: {
                        bridgechainUpdate: {
                            type: "object",
                            anyOf: [
                                {
                                    required: ["bridgechainId", "seedNodes"],
                                },
                                {
                                    required: ["bridgechainId", "ports"],
                                },
                            ],
                            properties: {
                                bridgechainId: { type: "integer", minimum: 1 },
                                seedNodes: seedNodesSchema,
                                ports: portsSchema,
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BridgechainUpdate);

    public serialize(): ByteBuffer {
        const { data } = this;

        const bridgechainUpdateAsset = data.asset.bridgechainUpdate as IBridgechainUpdateAsset;

        const seedNodesBuffers: Buffer[] = [];
        const seedNodes: string[] = bridgechainUpdateAsset.seedNodes;

        let seedNodesBuffersLength: number = 1;

        if (seedNodes) {
            for (const seed of seedNodes) {
                const seedBuffer: Buffer = Buffer.from(seed, "utf8");
                seedNodesBuffersLength += seedBuffer.length;
                seedNodesBuffers.push(seedBuffer);
            }
        }

        seedNodesBuffersLength += seedNodesBuffers.length;

        const ports: IBridgechainPorts = bridgechainUpdateAsset.ports;
        let portsLength: number = 0;

        const portNamesBuffers: Buffer[] = [];
        const portNumbers: number[] = [];

        let portsBuffersLength: number = 1;

        if (ports) {
            portsLength = Object.keys(ports).length;

            for (const [name, port] of Object.entries(ports)) {
                const nameBuffer: Buffer = Buffer.from(name, "utf8");
                portNamesBuffers.push(nameBuffer);
                portNumbers.push(port);
                portsBuffersLength += nameBuffer.length;
            }

            portsBuffersLength += portsLength;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            4 + // bridgechainId
                seedNodesBuffersLength +
                portsBuffersLength,
            true);
        buffer.writeUint32(bridgechainUpdateAsset.bridgechainId);

        buffer.writeUint8(seedNodesBuffers.length);
        for (const seedBuf of seedNodesBuffers) {
            buffer.writeUint8(seedBuf.length);
            buffer.append(seedBuf);
        }

        buffer.writeUint8(portsLength);
        for (const [i, nameBuffer] of portNamesBuffers.entries()) {
            buffer.writeUint8(nameBuffer.length);
            buffer.append(nameBuffer);
            buffer.writeUint16(portNumbers[i]);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const bridgechainId: number = buf.readUint32();

        const seedNodes: string[] = [];
        const seedNodesLength: number = buf.readUint8();
        for (let i = 0; i < seedNodesLength; i++) {
            const ipLength = buf.readUint8();
            const ip = buf.readString(ipLength);
            seedNodes.push(ip);
        }

        const ports: IBridgechainPorts = {};

        const portsLength: number = buf.readUint8();
        for (let i = 0; i < portsLength; i++) {
            const nameLength: number = buf.readUint8();
            const name: string = buf.readString(nameLength);
            const port: number = buf.readUint16();
            ports[name] = port;
        }

        data.asset = {
            bridgechainUpdate: {
                bridgechainId,
                seedNodes,
                ports,
            },
        };
    }
}
