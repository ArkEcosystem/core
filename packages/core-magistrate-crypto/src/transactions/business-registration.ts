import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBusinessRegistrationAsset } from "../interfaces";
import { businessSchema } from "./utils/business-schema";

const { schemas } = Transactions;

export class BusinessRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BusinessRegistration;
    public static key: string = "businessRegistration";
    public static version: number = 2;

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.BusinessRegistration,
    );

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessRegistration",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BusinessRegistration },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessRegistration"],
                    properties: {
                        businessRegistration: {
                            type: "object",
                            required: ["name", "website"],
                            properties: businessSchema,
                        },
                    },
                },
            },
        });
    }

    public serialize(): Utils.ByteBuffer {
        const { data } = this;

        AppUtils.assert.defined<IBusinessRegistrationAsset>(data.asset?.businessRegistration);

        const businessRegistrationAsset: IBusinessRegistrationAsset = data.asset.businessRegistration;
        const businessName: Buffer = Buffer.from(businessRegistrationAsset.name, "utf8");
        const businessWebsite: Buffer = Buffer.from(businessRegistrationAsset.website, "utf8");

        let businessVat: Buffer | undefined;
        let businessVatLength: number = 0;
        if (businessRegistrationAsset.vat) {
            businessVat = Buffer.from(businessRegistrationAsset.vat, "utf8");
            businessVatLength = businessVat.length;
        }

        let businessRepo: Buffer | undefined;
        let businessRepoLength: number = 0;
        if (businessRegistrationAsset.repository) {
            businessRepo = Buffer.from(businessRegistrationAsset.repository, "utf8");
            businessRepoLength = businessRepo.length;
        }

        const buffer = new Utils.ByteBuffer(
            Buffer.alloc(businessName.length + businessWebsite.length + businessVatLength + businessRepoLength + 4),
        );

        buffer.writeUInt8(businessName.length);
        buffer.writeBuffer(businessName);

        buffer.writeUInt8(businessWebsite.length);
        buffer.writeBuffer(businessWebsite);

        if (businessVat) {
            buffer.writeUInt8(businessVat.length);
            buffer.writeBuffer(businessVat);
        } else {
            buffer.writeUInt8(0);
        }

        if (businessRepo) {
            buffer.writeUInt8(businessRepo.length);
            buffer.writeBuffer(businessRepo);
        } else {
            buffer.writeUInt8(0);
        }

        return buffer;
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        const { data } = this;

        const nameLength: number = buf.readUInt8();
        const name: string = buf.readBuffer(nameLength).toString("utf8");

        const websiteLength: number = buf.readUInt8();
        const website: string = buf.readBuffer(websiteLength).toString("utf8");

        const businessRegistration: IBusinessRegistrationAsset = {
            name,
            website,
        };

        const vatLength = buf.readUInt8();
        if (vatLength > 0) {
            businessRegistration.vat = buf.readBuffer(vatLength).toString("utf8");
        }

        const repositoryLength: number = buf.readUInt8();
        if (repositoryLength > 0) {
            businessRegistration.repository = buf.readBuffer(repositoryLength).toString("utf8");
        }

        data.asset = {
            businessRegistration,
        };
    }
}
