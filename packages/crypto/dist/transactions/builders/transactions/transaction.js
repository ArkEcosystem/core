"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const crypto_1 = require("../../../crypto");
const enums_1 = require("../../../enums");
const errors_1 = require("../../../errors");
const identities_1 = require("../../../identities");
const config_1 = require("../../../managers/config");
const utils_1 = require("../../../utils");
const signer_1 = require("../../signer");
const verifier_1 = require("../../verifier");
class TransactionBuilder {
    constructor() {
        this.signWithSenderAsRecipient = false;
        this.data = {
            id: undefined,
            timestamp: crypto_1.Slots.getTime(),
            typeGroup: enums_1.TransactionTypeGroup.Test,
            nonce: utils_1.BigNumber.ZERO,
            version: config_1.configManager.getMilestone().aip11 ? 0x02 : 0x01,
        };
    }
    build(data = {}) {
        return __1.TransactionFactory.fromData({ ...this.data, ...data }, false);
    }
    version(version) {
        this.data.version = version;
        return this.instance();
    }
    typeGroup(typeGroup) {
        this.data.typeGroup = typeGroup;
        return this.instance();
    }
    nonce(nonce) {
        if (nonce) {
            this.data.nonce = utils_1.BigNumber.make(nonce);
        }
        return this.instance();
    }
    network(network) {
        this.data.network = network;
        return this.instance();
    }
    fee(fee) {
        if (fee) {
            this.data.fee = utils_1.BigNumber.make(fee);
        }
        return this.instance();
    }
    amount(amount) {
        this.data.amount = utils_1.BigNumber.make(amount);
        return this.instance();
    }
    recipientId(recipientId) {
        this.data.recipientId = recipientId;
        return this.instance();
    }
    senderPublicKey(publicKey) {
        this.data.senderPublicKey = publicKey;
        return this.instance();
    }
    vendorField(vendorField) {
        const limit = utils_1.maxVendorFieldLength();
        if (vendorField) {
            if (Buffer.from(vendorField).length > limit) {
                throw new errors_1.VendorFieldLengthExceededError(limit);
            }
            this.data.vendorField = vendorField;
        }
        return this.instance();
    }
    sign(passphrase) {
        const keys = identities_1.Keys.fromPassphrase(passphrase);
        return this.signWithKeyPair(keys);
    }
    signWithWif(wif, networkWif) {
        const keys = identities_1.Keys.fromWIF(wif, {
            wif: networkWif || config_1.configManager.get("network.wif"),
        });
        return this.signWithKeyPair(keys);
    }
    secondSign(secondPassphrase) {
        return this.secondSignWithKeyPair(identities_1.Keys.fromPassphrase(secondPassphrase));
    }
    secondSignWithWif(wif, networkWif) {
        const keys = identities_1.Keys.fromWIF(wif, {
            wif: networkWif || config_1.configManager.get("network.wif"),
        });
        return this.secondSignWithKeyPair(keys);
    }
    multiSign(passphrase, index) {
        const keys = identities_1.Keys.fromPassphrase(passphrase);
        return this.multiSignWithKeyPair(index, keys);
    }
    multiSignWithWif(index, wif, networkWif) {
        const keys = identities_1.Keys.fromWIF(wif, {
            wif: networkWif || config_1.configManager.get("network.wif"),
        });
        return this.multiSignWithKeyPair(index, keys);
    }
    verify() {
        return verifier_1.Verifier.verifyHash(this.data);
    }
    getStruct() {
        if (!this.data.senderPublicKey || (!this.data.signature && !this.data.signatures)) {
            throw new errors_1.MissingTransactionSignatureError();
        }
        const struct = {
            id: __1.Utils.getId(this.data).toString(),
            signature: this.data.signature,
            secondSignature: this.data.secondSignature,
            version: this.data.version,
            type: this.data.type,
            fee: this.data.fee,
            senderPublicKey: this.data.senderPublicKey,
            network: this.data.network,
        };
        if (this.data.version === 1) {
            struct.timestamp = this.data.timestamp;
        }
        else {
            struct.typeGroup = this.data.typeGroup;
            struct.nonce = this.data.nonce;
        }
        if (Array.isArray(this.data.signatures)) {
            struct.signatures = this.data.signatures;
        }
        return struct;
    }
    signWithKeyPair(keys) {
        this.data.senderPublicKey = keys.publicKey;
        if (this.signWithSenderAsRecipient) {
            this.data.recipientId = identities_1.Address.fromPublicKey(keys.publicKey, this.data.network);
        }
        this.data.signature = signer_1.Signer.sign(this.getSigningObject(), keys);
        return this.instance();
    }
    secondSignWithKeyPair(keys) {
        this.data.secondSignature = signer_1.Signer.secondSign(this.getSigningObject(), keys);
        return this.instance();
    }
    multiSignWithKeyPair(index, keys) {
        if (!this.data.signatures) {
            this.data.signatures = [];
        }
        this.version(2);
        signer_1.Signer.multiSign(this.getSigningObject(), keys, index);
        return this.instance();
    }
    getSigningObject() {
        const data = {
            ...this.data,
        };
        for (const key of Object.keys(data)) {
            if (["model", "network", "id"].includes(key)) {
                delete data[key];
            }
        }
        return data;
    }
}
exports.TransactionBuilder = TransactionBuilder;
//# sourceMappingURL=transaction.js.map