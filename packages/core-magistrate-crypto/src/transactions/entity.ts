import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import {
    EntityAction,
    MagistrateTransactionGroup,
    MagistrateTransactionStaticFees,
    MagistrateTransactionType,
} from "../enums";
import { IEntityAsset } from "../interfaces";

import { register, resign, update } from "./utils/entity-schemas";

const { schemas } = Transactions;

export class EntityTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.Entity;
    public static key: string = "entity";
    public static version: number = 2;

    public static getSchema(): Transactions.schemas.TransactionSchema {
        const baseAssetDataProps = {
            type: { type: "integer", minimum: 0, maximum: 255 },
            subType: { type: "integer", minimum: 0, maximum: 255 },
            registrationId: { $ref: "transactionId" },
        };

        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "entity",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.Entity },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    anyOf: [
                        {
                            required: ["type", "subType", "action", "data"],
                            additionalProperties: false,
                            properties: {
                                ...baseAssetDataProps,
                                action: { const: EntityAction.Register },
                                data: register,
                            },
                        },
                        {
                            required: ["type", "subType", "action", "data", "registrationId"],
                            additionalProperties: false,
                            properties: {
                                ...baseAssetDataProps,
                                action: { const: EntityAction.Resign },
                                data: resign,
                            },
                        },
                        {
                            required: ["type", "subType", "action", "data", "registrationId"],
                            additionalProperties: false,
                            properties: {
                                ...baseAssetDataProps,
                                action: { const: EntityAction.Update },
                                data: update,
                            },
                        },
                    ],
                },
            },
        });
    }

    public static staticFee(feeContext: { height?: number; data?: Interfaces.ITransactionData } = {}): Utils.BigNumber {
        // there should always be a feeContext.data except for tx builder when setting default fee in constructor
        return feeContext.data ? this.staticFeeByAction[feeContext.data.asset.action] : this.defaultStaticFee;
    }
    protected static staticFeeByAction = {
        [EntityAction.Register]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityRegister),
        [EntityAction.Update]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityUpdate),
        [EntityAction.Resign]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityResign),
    };
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.EntityRegister,
    );

    public serialize(): ByteBuffer {
        const { data } = this;

        const asset: IEntityAsset = data.asset as IEntityAsset;

        const buffer: ByteBuffer = new ByteBuffer();

        buffer.writeUint8(asset.type);
        buffer.writeUint8(asset.subType);
        buffer.writeUint8(asset.action);

        const registrationIdBuffer = Buffer.from(asset.registrationId || "", "hex");
        buffer.writeUint8(registrationIdBuffer.length);
        buffer.append(registrationIdBuffer, "hex");

        const nameBuffer = Buffer.from(asset.data.name || "");
        buffer.writeUint8(nameBuffer.length);
        buffer.append(nameBuffer);

        const ipfsDataBuffer = Buffer.from(asset.data.ipfsData || "");
        buffer.writeUint8(ipfsDataBuffer.length);
        buffer.append(ipfsDataBuffer);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {};

        data.asset.type = buf.readUint8();
        data.asset.subType = buf.readUint8();
        data.asset.action = buf.readUint8();

        const registrationIdBufferLength: number = buf.readUint8();
        if (registrationIdBufferLength > 0) {
            data.asset.registrationId = buf.readBytes(registrationIdBufferLength).toString("hex");
        }

        data.asset.data = {};

        const nameBufferLength: number = buf.readUint8();
        if (nameBufferLength > 0) {
            data.asset.data.name = buf.readString(nameBufferLength);
        }

        const ipfsDataBufferLength: number = buf.readUint8();
        if (ipfsDataBufferLength > 0) {
            data.asset.data.ipfsData = buf.readString(ipfsDataBufferLength);
        }
    }
}
