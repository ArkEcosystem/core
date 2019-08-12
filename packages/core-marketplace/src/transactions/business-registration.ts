import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IBusinessRegistrationAsset } from "../interfaces";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";

const { schemas } = Transactions;

const businessRegistrationType: number = MarketplaceTransactionTypes.BusinessRegistration;

export class BusinessRegistrationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = businessRegistrationType;
    public static key: string = "businessRegistration";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessRegistration",
            required: ["asset"],
            properties: {
                type: { transactionType: businessRegistrationType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessRegistration"],
                    properties: {
                        businessRegistration: {
                            type: "object",
                            required: ["name", "website"],
                            properties: {
                                name: {
                                    type: "string",
                                    minLength: 1,
                                    maxLength: 40,
                                },
                                website: {
                                    type: "string",
                                    minLength: 4,
                                    maxLength: 50,
                                },
                                vat: {
                                    oneOf: [
                                        {
                                            type: "string",
                                            minLength: 8,
                                            maxLength: 15,
                                        },
                                        {
                                            type: "null",
                                        },
                                    ],
                                },
                                github: {
                                    oneOf: [
                                        {
                                            type: "string",
                                            minLength: 11,
                                            maxLength: 50,
                                        },
                                        {
                                            type: "null",
                                        },
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BusinessRegistration);

    public serialize(): ByteBuffer {
        const { data } = this;

        const businessRegistrationAsset = data.asset.businessRegistration as IBusinessRegistrationAsset;

        let businessVat: Buffer;
        let businessVatLength = 0;

        let businessGithub: Buffer;
        let businessGithubLength = 0;

        const businessName: Buffer = Buffer.from(businessRegistrationAsset.name, "utf8");
        const businessWebsite: Buffer = Buffer.from(businessRegistrationAsset.website, "utf8");

        if (businessRegistrationAsset.vat) {
            businessVat = Buffer.from(businessRegistrationAsset.vat, "utf8");
            businessVatLength = businessVat.length;
        }

        if (businessRegistrationAsset.github) {
            businessGithub = Buffer.from(businessRegistrationAsset.github, "utf8");
            businessGithubLength = businessGithub.length;
        }

        const buffer: ByteBuffer = new ByteBuffer(
            businessName.length + businessWebsite.length + businessVatLength + businessGithubLength + 4,
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

        if (businessGithub) {
            buffer.writeByte(businessGithub.length);
            buffer.append(businessGithub, "hex");
        } else {
            buffer.writeByte(0);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        let vat: string;
        let github: string;

        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);

        const websiteLength = buf.readUint8();
        const website = buf.readString(websiteLength);

        const businessRegistration: IBusinessRegistrationAsset = {
            name,
            website,
        };

        const vatLength = buf.readUint8();
        if (vatLength !== 0) {
            vat = buf.readString(vatLength);
            businessRegistration.vat = vat;
        }

        const gitHubLength = buf.readUint8();
        if (gitHubLength !== 0) {
            github = buf.readString(gitHubLength);
            businessRegistration.github = github;
        }

        data.asset = {
            businessRegistration,
        };
    }
}
