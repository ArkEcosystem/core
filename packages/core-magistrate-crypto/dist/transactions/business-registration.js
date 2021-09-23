"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const bytebuffer_1 = __importDefault(require("bytebuffer"));
const enums_1 = require("../enums");
const business_schema_1 = require("./utils/business-schema");
const { schemas } = crypto_1.Transactions;
class BusinessRegistrationTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessRegistration",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: enums_1.MagistrateTransactionType.BusinessRegistration },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                asset: {
                    type: "object",
                    required: ["businessRegistration"],
                    properties: {
                        businessRegistration: {
                            type: "object",
                            required: ["name", "website"],
                            properties: business_schema_1.businessSchema,
                        },
                    },
                },
            },
        });
    }
    serialize() {
        const { data } = this;
        const businessRegistrationAsset = data.asset.businessRegistration;
        const businessName = Buffer.from(businessRegistrationAsset.name, "utf8");
        const businessWebsite = Buffer.from(businessRegistrationAsset.website, "utf8");
        let businessVat;
        let businessVatLength = 0;
        if (businessRegistrationAsset.vat) {
            businessVat = Buffer.from(businessRegistrationAsset.vat, "utf8");
            businessVatLength = businessVat.length;
        }
        let businessRepo;
        let businessRepoLength = 0;
        if (businessRegistrationAsset.repository) {
            businessRepo = Buffer.from(businessRegistrationAsset.repository, "utf8");
            businessRepoLength = businessRepo.length;
        }
        const buffer = new bytebuffer_1.default(businessName.length + businessWebsite.length + businessVatLength + businessRepoLength + 4, true);
        buffer.writeByte(businessName.length);
        buffer.append(businessName, "hex");
        buffer.writeByte(businessWebsite.length);
        buffer.append(businessWebsite, "hex");
        if (businessVat) {
            buffer.writeByte(businessVat.length);
            buffer.append(businessVat, "hex");
        }
        else {
            buffer.writeByte(0);
        }
        if (businessRepo) {
            buffer.writeByte(businessRepo.length);
            buffer.append(businessRepo, "hex");
        }
        else {
            buffer.writeByte(0);
        }
        return buffer;
    }
    deserialize(buf) {
        const { data } = this;
        const nameLength = buf.readUint8();
        const name = buf.readString(nameLength);
        const websiteLength = buf.readUint8();
        const website = buf.readString(websiteLength);
        const businessRegistration = {
            name,
            website,
        };
        const vatLength = buf.readUint8();
        if (vatLength > 0) {
            businessRegistration.vat = buf.readString(vatLength);
        }
        const repositoryLength = buf.readUint8();
        if (repositoryLength > 0) {
            businessRegistration.repository = buf.readString(repositoryLength);
        }
        data.asset = {
            businessRegistration,
        };
    }
}
exports.BusinessRegistrationTransaction = BusinessRegistrationTransaction;
BusinessRegistrationTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BusinessRegistrationTransaction.type = enums_1.MagistrateTransactionType.BusinessRegistration;
BusinessRegistrationTransaction.key = "businessRegistration";
BusinessRegistrationTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BusinessRegistration);
//# sourceMappingURL=business-registration.js.map