import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

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
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.EntityRegister,
    );
    protected static staticFeeByAction = {
        [EntityAction.Register]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityRegister),
        [EntityAction.Update]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityUpdate),
        [EntityAction.Resign]: Utils.BigNumber.make(MagistrateTransactionStaticFees.EntityResign),
    };

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
        return feeContext?.data?.asset ? this.staticFeeByAction[feeContext.data.asset.action] : this.defaultStaticFee;
    }

    public serialize(): Utils.ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IEntityAsset>(data.asset);

        const asset: IEntityAsset = data.asset;

        const registrationIdBuffer = Buffer.from(asset.registrationId || "", "hex");
        const nameBuffer = Buffer.from(asset.data.name || "");
        const ipfsDataBuffer = Buffer.from(asset.data.ipfsData || "");

        const buffer = new Utils.ByteBuffer(
            Buffer.alloc(
                3 + // Type, SubType, Action
                    1 + // RegistrationId Length
                    registrationIdBuffer.length +
                    1 + // Name Length
                    nameBuffer.length +
                    1 + // IPFSData Length
                    ipfsDataBuffer.length,
            ),
        );

        buffer.writeUInt8(asset.type);
        buffer.writeUInt8(asset.subType);
        buffer.writeUInt8(asset.action);

        buffer.writeUInt8(registrationIdBuffer.length);
        buffer.writeBuffer(registrationIdBuffer);

        buffer.writeUInt8(nameBuffer.length);
        buffer.writeBuffer(nameBuffer);

        buffer.writeUInt8(ipfsDataBuffer.length);
        buffer.writeBuffer(ipfsDataBuffer);

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;
        data.asset = {};

        data.asset.type = buf.readUInt8();
        data.asset.subType = buf.readUInt8();
        data.asset.action = buf.readUInt8();

        const registrationIdBufferLength: number = buf.readUInt8();
        if (registrationIdBufferLength > 0) {
            data.asset.registrationId = buf.readBuffer(registrationIdBufferLength).toString("hex");
        }

        data.asset.data = {};

        const nameBufferLength: number = buf.readUInt8();
        if (nameBufferLength > 0) {
            data.asset.data.name = buf.readBuffer(nameBufferLength).toString("utf8");
        }

        const ipfsDataBufferLength: number = buf.readUInt8();
        if (ipfsDataBufferLength > 0) {
            data.asset.data.ipfsData = buf.readBuffer(ipfsDataBufferLength).toString("utf8");
        }
    }
}
