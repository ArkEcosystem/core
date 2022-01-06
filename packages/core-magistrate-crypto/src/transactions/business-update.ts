import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBusinessUpdateAsset } from "../interfaces";
import { businessSchema } from "./utils/business-schema";

const { schemas } = Transactions;

export class BusinessUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BusinessUpdate;
    public static key: string = "businessUpdate";
    public static version: number = 2;

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.BusinessUpdate,
    );

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

    public serialize(): Utils.ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IBusinessUpdateAsset>(data.asset?.businessUpdate);

        const businessUpdateAsset: IBusinessUpdateAsset = data.asset.businessUpdate;

        let businessName: Buffer | undefined;
        let businessNameLength: number = 0;

        let businessWebsite: Buffer | undefined;
        let businessWebsiteLength: number = 0;

        let businessVat: Buffer | undefined;
        let businessVatLength: number = 0;

        let businessRepository: Buffer | undefined;
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

        const buffer = new Utils.ByteBuffer(
            Buffer.alloc(businessNameLength + businessWebsiteLength + businessVatLength + businessRepositoryLength + 4),
        );

        buffer.writeUInt8(businessNameLength);
        if (businessName && businessNameLength !== 0) {
            buffer.writeBuffer(businessName);
        }

        buffer.writeUInt8(businessWebsiteLength);
        if (businessWebsite && businessWebsiteLength !== 0) {
            buffer.writeBuffer(businessWebsite);
        }

        buffer.writeUInt8(businessVatLength);
        if (businessVat && businessVatLength !== 0) {
            buffer.writeBuffer(businessVat);
        }

        buffer.writeUInt8(businessRepositoryLength);
        if (businessRepository && businessRepositoryLength !== 0) {
            buffer.writeBuffer(businessRepository);
        }

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;

        const businessUpdate: IBusinessUpdateAsset = {};

        const nameLength: number = buf.readUInt8();
        if (nameLength !== 0) {
            businessUpdate.name = buf.readBuffer(nameLength).toString("utf8");
        }

        const websiteLength: number = buf.readUInt8();
        if (websiteLength !== 0) {
            businessUpdate.website = buf.readBuffer(websiteLength).toString("utf8");
        }

        const vatLength: number = buf.readUInt8();
        if (vatLength !== 0) {
            businessUpdate.vat = buf.readBuffer(vatLength).toString("utf8");
        }

        const repositoryLength: number = buf.readUInt8();
        if (repositoryLength !== 0) {
            businessUpdate.repository = buf.readBuffer(repositoryLength).toString("utf8");
        }

        data.asset = {
            businessUpdate,
        };
    }
}
