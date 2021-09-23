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
class BusinessUpdateTransaction extends crypto_1.Transactions.Transaction {
    static getSchema() {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessUpdate",
            required: ["asset", "typeGroup"],
            properties: {
                type: { transactionType: enums_1.MagistrateTransactionType.BusinessUpdate },
                typeGroup: { const: enums_1.MagistrateTransactionGroup },
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
                            properties: business_schema_1.businessSchema,
                        },
                    },
                },
            },
        });
    }
    serialize() {
        const { data } = this;
        const businessUpdateAsset = data.asset.businessUpdate;
        let businessName;
        let businessNameLength = 0;
        let businessWebsite;
        let businessWebsiteLength = 0;
        let businessVat;
        let businessVatLength = 0;
        let businessRepository;
        let businessRepositoryLength = 0;
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
        const buffer = new bytebuffer_1.default(businessNameLength + businessWebsiteLength + businessVatLength + businessRepositoryLength + 4, true);
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
    deserialize(buf) {
        const { data } = this;
        const businessUpdate = {};
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
        const repositoryLength = buf.readUint8();
        if (repositoryLength !== 0) {
            businessUpdate.repository = buf.readString(repositoryLength);
        }
        data.asset = {
            businessUpdate,
        };
    }
}
exports.BusinessUpdateTransaction = BusinessUpdateTransaction;
BusinessUpdateTransaction.typeGroup = enums_1.MagistrateTransactionGroup;
BusinessUpdateTransaction.type = enums_1.MagistrateTransactionType.BusinessUpdate;
BusinessUpdateTransaction.key = "businessUpdate";
BusinessUpdateTransaction.defaultStaticFee = crypto_1.Utils.BigNumber.make(enums_1.MagistrateTransactionStaticFees.BusinessUpdate);
//# sourceMappingURL=business-update.js.map