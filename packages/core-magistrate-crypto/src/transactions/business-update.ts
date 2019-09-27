import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBusinessUpdateAsset } from "../interfaces";
import { businessSchema } from "./utils/business-schema";

const { schemas } = Transactions;

export class BusinessUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BusinessUpdate;
    public static key: string = "businessUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessUpdate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BusinessUpdate },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessUpdate"],
                    additionalProperties: false,
                    properties: {
                        businessUpdate: {
                            type: "object",
                            anyOf: [
                                {
                                    required: ["name"],
                                },
                                {
                                    required: ["website"],
                                },
                                {
                                    required: ["vat"],
                                },
                                {
                                    required: ["repository"],
                                },
                            ],
                            properties: businessSchema,
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.BusinessUpdate,
    );

    public serialize(): ByteBuffer {
        const { data } = this;
        const businessUpdateAsset = data.asset.businessUpdate as IBusinessUpdateAsset;

        let businessName: Buffer;
        let businessNameLength: number = 0;

        let businessWebsite: Buffer;
        let businessWebsiteLength: number = 0;

        let businessVat: Buffer;
        let businessVatLength: number = 0;

        let businessRepository: Buffer;
        let businessRepositoryLength: number = 0;

        if (businessUpdateAsset.name) {
            businessName = Buffer.from(businessUpdateAsset.name, "utf8");
            businessNameLength = businessName.length;
        }

        if (businessUpdateAsset.website) {
            businessWebsite = Buffer.from(businessUpdateAsset.website, "utf8");
            businessWebsiteLength = businessWebsite.length;
        }

        if (businessUpdateAsset.vat) {
            businessVat = Buffer.from(businessUpdateAsset.vat, "utf8");
            businessVatLength = businessVat.length;
        }

        if (businessUpdateAsset.repository) {
            businessRepository = Buffer.from(businessUpdateAsset.repository, "utf8");
            businessRepositoryLength = businessRepository.length;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            businessNameLength + businessWebsiteLength + businessVatLength + businessRepositoryLength + 4,
            true,
        );

        buffer.writeByte(businessNameLength);
        if (businessNameLength !== 0) {
            buffer.append(businessName);
        }

        buffer.writeByte(businessWebsiteLength);
        if (businessWebsiteLength !== 0) {
            buffer.append(businessWebsite);
        }

        buffer.writeByte(businessVatLength);
        if (businessVatLength !== 0) {
            buffer.append(businessVat);
        }

        buffer.writeByte(businessRepositoryLength);
        if (businessRepositoryLength !== 0) {
            buffer.append(businessRepository);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const businessUpdate: IBusinessUpdateAsset = {};

        const nameLength: number = buf.readUint8();
        if (nameLength !== 0) {
            businessUpdate.name = buf.readString(nameLength);
        }

        const websiteLength: number = buf.readUint8();
        if (websiteLength !== 0) {
            businessUpdate.website = buf.readString(websiteLength);
        }

        const vatLength: number = buf.readUint8();
        if (vatLength !== 0) {
            businessUpdate.vat = buf.readString(vatLength);
        }

        const repositoryLength: number = buf.readUint8();
        if (repositoryLength !== 0) {
            businessUpdate.repository = buf.readString(repositoryLength);
        }

        data.asset = {
            businessUpdate,
        };
    }
}
