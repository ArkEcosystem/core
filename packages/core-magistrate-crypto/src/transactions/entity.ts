import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";

import {
    EntityType,
    EntitySubType,
    EntityAction,
    MagistrateTransactionGroup,
    MagistrateTransactionStaticFees,
    MagistrateTransactionType
} from "../enums";
import { IEntityAsset } from "../interfaces";

import { register, update, resign } from "./utils/entity-schemas";

const { schemas } = Transactions;

export class EntityTransaction extends Transactions.Transaction {
    //
    // TODO ! Review uint8 for string length everywhere but might need more
    //
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.Entity;
    public static key: string = "entity";
    public static version: number = 2;

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.Entity,
    );

    public static getSchema(): Transactions.schemas.TransactionSchema {
        const baseAssetDataProps = {
            type: { enum: [ EntityType.Business, EntityType.Bridgechain, EntityType.Developer, EntityType.Plugin] },
            subType: {
                enum: [ EntitySubType.None, EntitySubType.PluginCore, EntitySubType.PluginDesktop ],
            }, // subType depends on type but the type/subType check is in handler
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
                            }
                        },
                        {
                            required: ["type", "subType", "action", "data", "registrationId"],
                            additionalProperties: false,
                            properties: {
                                ...baseAssetDataProps,
                                action: { const: EntityAction.Resign },
                                data: resign,
                            }
                        },
                        {
                            required: ["type", "subType", "action", "data", "registrationId"],
                            additionalProperties: false,
                            properties: {
                                ...baseAssetDataProps,
                                action: { const: EntityAction.Update },
                                data: update,
                            }
                        }
                    ],
                },
            },
        });
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IEntityAsset>(data.asset);

        const asset: IEntityAsset = data.asset;

        const buffer: ByteBuffer = new ByteBuffer(); // TODO length?
        
        buffer.writeUint8(asset.type);
        buffer.writeUint8(asset.subType);
        buffer.writeUint8(asset.action);

        const registrationIdBuffer = Buffer.from(asset.registrationId || "", "hex");
        buffer.writeUint8(registrationIdBuffer.length);
        buffer.append(registrationIdBuffer, "hex");

        const nameBuffer = Buffer.from(asset.data.name || "");
        buffer.writeUint8(nameBuffer.length);
        buffer.append(nameBuffer);

        const descriptionBuffer = Buffer.from(asset.data.description || "");
        buffer.writeUint8(descriptionBuffer.length);
        buffer.append(descriptionBuffer);

        const websiteBuffer = Buffer.from(asset.data.website || "");
        buffer.writeUint8(websiteBuffer.length);
        buffer.append(websiteBuffer);
        
        const sourceControl = asset.data.sourceControl || {};
        for (const sourceControlProvider of ["github", "gitlab", "bitbucket", "npmjs"]) {
            const sourceControlBuffer = Buffer.from(sourceControl[sourceControlProvider] || "");
            buffer.writeUint8(sourceControlBuffer.length);
            buffer.append(sourceControlBuffer);
        }

        const socialMedia = asset.data.socialMedia || {};
        for (const socialMediaProvider of ["twitter", "facebook", "linkedin"]) {
            const socialMediaBuffer = Buffer.from(socialMedia[socialMediaProvider] || "");
            buffer.writeUint8(socialMediaBuffer.length);
            buffer.append(socialMediaBuffer);
        }

        const images = asset.data.images || [];
        buffer.writeUint8(images.length);
        for (const image of images) {
            const imageBuffer = Buffer.from(image);
            buffer.writeUint8(imageBuffer.length);
            buffer.append(imageBuffer);
        }

        const videos = asset.data.videos || [];
        buffer.writeUint8(videos.length);
        for (const video of videos) {
            const videoBuffer = Buffer.from(video);
            buffer.writeUint8(videoBuffer.length);
            buffer.append(videoBuffer);
        }

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

        const descriptionBufferLength: number = buf.readUint8();
        if (descriptionBufferLength > 0) {
            data.asset.data.description = buf.readString(descriptionBufferLength);
        }

        const websiteBufferLength: number = buf.readUint8();
        if (websiteBufferLength > 0) {
            data.asset.data.website = buf.readString(websiteBufferLength);
        }

        for (const sourceControlProvider of ["github", "gitlab", "bitbucket", "npmjs"]) {
            const sourceControlBufferLength: number = buf.readUint8();
            if (sourceControlBufferLength > 0) {
                data.asset.data.sourceControl = data.asset.data.sourceControl || {};
                data.asset.data.sourceControl[sourceControlProvider] = buf.readString(sourceControlBufferLength);
            }
        }
        
        for (const socialMediaProvider of ["twitter", "facebook", "linkedin"]) {
            const socialMediaBufferLength: number = buf.readUint8();
            if (socialMediaBufferLength > 0) {
                data.asset.data.socialMedia = data.asset.data.socialMedia || {};
                data.asset.data.socialMedia[socialMediaProvider] = buf.readString(socialMediaBufferLength);
            }
        }

        const imagesLength = buf.readUint8();
        if (imagesLength > 0) {
            data.asset.data.images = [];
        }
        for (let i = 0; i < imagesLength; i++) {
            const imageBufferLength = buf.readUint8();
            data.asset.data.images.push(buf.readString(imageBufferLength));
        }

        const videosLength = buf.readUint8();
        if (videosLength > 0) {
            data.asset.data.videos = [];
        }
        for (let i = 0; i < videosLength; i++) {
            const videoBufferLength = buf.readUint8();
            data.asset.data.videos.push(buf.readString(videoBufferLength));
        }
    }
}
