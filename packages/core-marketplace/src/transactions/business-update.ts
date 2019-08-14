import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBusinessUpdateAsset } from "../interfaces";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";
import { businessProperties } from "./utils/business-schema";

const { schemas } = Transactions;

const businessUpdateType: number = MarketplaceTransactionTypes.BusinessUpdate;

export class BusinessUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = businessUpdateType;
    public static key: string = "businessUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessUpdate",
            required: ["asset"],
            properties: {
                type: { transactionType: businessUpdateType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessUpdate"],
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
                                    required: ["github"],
                                },
                            ],
                            properties: businessProperties,
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BusinessUpdate);

    public serialize(): ByteBuffer {
        const { data } = this;
        const businessUpdateAsset = data.asset.businessUpdate as IBusinessUpdateAsset;

        let businessName: Buffer;
        let businessNameLength = 0;

        let businessWebsite: Buffer;
        let businessWebsiteLength = 0;

        let businessVat: Buffer;
        let businessVatLength = 0;

        let businessGithub: Buffer;
        let businessGithubLength = 0;

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

        if (businessUpdateAsset.organizationRepository) {
            businessGithub = Buffer.from(businessUpdateAsset.organizationRepository, "utf8");
            businessGithubLength = businessGithub.length;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            businessNameLength + businessWebsiteLength + businessVatLength + businessGithubLength + 4,
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

        buffer.writeByte(businessGithubLength);
        if (businessGithubLength !== 0) {
            buffer.append(businessGithub);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const businessUpdate: IBusinessUpdateAsset = {};

        const nameLength = buf.readUint8();
        if (nameLength !== 0) {
            businessUpdate.name = buf.readString(nameLength);
        }

        const websiteLength = buf.readUint8();
        if (websiteLength !== 0) {
            businessUpdate.website = buf.readString(websiteLength);
        }

        const vatLength = buf.readUint8();
        if (vatLength !== 0) {
            businessUpdate.vat = buf.readString(vatLength);
        }

        const githubLength = buf.readUint8();
        if (githubLength !== 0) {
            businessUpdate.organizationRepository = buf.readString(githubLength);
        }

        data.asset = {
            businessUpdate,
        };
    }
}
