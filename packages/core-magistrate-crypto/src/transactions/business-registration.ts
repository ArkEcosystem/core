import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";
import { IBusinessRegistrationAsset } from "../interfaces";
import { businessSchema } from "./utils/business-schema";

const { schemas } = Transactions;

export class BusinessRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BusinessRegistration;
    public static key: string = "businessRegistration";

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

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        MagistrateTransactionStaticFees.BusinessRegistration,
    );

    public serialize(): ByteBuffer {
        const { data } = this;

        const businessRegistrationAsset = data.asset.businessRegistration as IBusinessRegistrationAsset;
        const businessName: Buffer = Buffer.from(businessRegistrationAsset.name, "utf8");
        const businessWebsite: Buffer = Buffer.from(businessRegistrationAsset.website, "utf8");

        let businessVat: Buffer;
        let businessVatLength: number = 0;
        if (businessRegistrationAsset.vat) {
            businessVat = Buffer.from(businessRegistrationAsset.vat, "utf8");
            businessVatLength = businessVat.length;
        }

        let businessRepo: Buffer;
        let businessRepoLength: number = 0;
        if (businessRegistrationAsset.repository) {
            businessRepo = Buffer.from(businessRegistrationAsset.repository, "utf8");
            businessRepoLength = businessRepo.length;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            businessName.length + businessWebsite.length + businessVatLength + businessRepoLength + 4,
            true,
        );

        buffer.writeByte(businessName.length);
        buffer.append(businessName, "hex");

        buffer.writeByte(businessWebsite.length);
        buffer.append(businessWebsite, "hex");

        if (businessVat) {
            buffer.writeByte(businessVat.length);
            buffer.append(businessVat, "hex");
        } else {
            buffer.writeByte(0);
        }

        if (businessRepo) {
            buffer.writeByte(businessRepo.length);
            buffer.append(businessRepo, "hex");
        } else {
            buffer.writeByte(0);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nameLength: number = buf.readUint8();
        const name: string = buf.readString(nameLength);

        const websiteLength: number = buf.readUint8();
        const website: string = buf.readString(websiteLength);

        const businessRegistration: IBusinessRegistrationAsset = {
            name,
            website,
        };

        const vatLength = buf.readUint8();
        if (vatLength > 0) {
            businessRegistration.vat = buf.readString(vatLength);
        }

        const repositoryLength: number = buf.readUint8();
        if (repositoryLength > 0) {
            businessRegistration.repository = buf.readString(repositoryLength);
        }

        data.asset = {
            businessRegistration,
        };
    }
}
