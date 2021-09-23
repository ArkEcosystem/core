"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const node_forge_1 = __importDefault(require("node-forge"));
const wif_1 = __importDefault(require("wif"));
class Delegate {
    constructor(passphrase, network, password) {
        this.bip38 = false;
        this.network = network;
        this.keySize = 32; // AES-256
        this.iterations = 5000;
        if (crypto_1.Crypto.bip38.verify(passphrase)) {
            this.keys = Delegate.decryptPassphrase(passphrase, network, password);
            this.publicKey = this.keys.publicKey;
            this.address = crypto_1.Identities.Address.fromPublicKey(this.keys.publicKey, network.pubKeyHash);
            this.otpSecret = node_forge_1.default.random.getBytesSync(128);
            this.bip38 = true;
            this.encryptKeysWithOtp();
        }
        else {
            this.keys = crypto_1.Identities.Keys.fromPassphrase(passphrase);
            this.publicKey = this.keys.publicKey;
            this.address = crypto_1.Identities.Address.fromPublicKey(this.publicKey, network.pubKeyHash);
        }
    }
    static encryptPassphrase(passphrase, network, password) {
        const keys = crypto_1.Identities.Keys.fromPassphrase(passphrase);
        const decoded = wif_1.default.decode(crypto_1.Identities.WIF.fromKeys(keys, network), network.wif);
        return crypto_1.Crypto.bip38.encrypt(decoded.privateKey, decoded.compressed, password);
    }
    static decryptPassphrase(passphrase, network, password) {
        const decryptedWif = crypto_1.Crypto.bip38.decrypt(passphrase, password);
        const wifKey = wif_1.default.encode(network.wif, decryptedWif.privateKey, decryptedWif.compressed);
        return crypto_1.Identities.Keys.fromWIF(wifKey, network);
    }
    encryptKeysWithOtp() {
        const wifKey = crypto_1.Identities.WIF.fromKeys(this.keys, this.network);
        this.keys = undefined;
        this.otp = node_forge_1.default.random.getBytesSync(16);
        this.encryptedKeys = this.encryptDataWithOtp(wifKey, this.otp);
    }
    decryptKeysWithOtp() {
        const wifKey = this.decryptDataWithOtp(this.encryptedKeys, this.otp);
        this.keys = crypto_1.Identities.Keys.fromWIF(wifKey, this.network);
        this.otp = undefined;
        this.encryptedKeys = undefined;
    }
    // @TODO: reduce nesting
    forge(transactions, options) {
        if (!options.version && (this.encryptedKeys || !this.bip38)) {
            const transactionData = {
                amount: crypto_1.Utils.BigNumber.ZERO,
                fee: crypto_1.Utils.BigNumber.ZERO,
            };
            const payloadBuffers = [];
            for (const transaction of transactions) {
                transactionData.amount = transactionData.amount.plus(transaction.amount);
                transactionData.fee = transactionData.fee.plus(transaction.fee);
                payloadBuffers.push(Buffer.from(transaction.id, "hex"));
            }
            if (this.bip38) {
                this.decryptKeysWithOtp();
            }
            const block = crypto_1.Blocks.BlockFactory.make({
                version: 0,
                generatorPublicKey: this.publicKey,
                timestamp: options.timestamp,
                previousBlock: options.previousBlock.id,
                previousBlockHex: options.previousBlock.idHex,
                height: options.previousBlock.height + 1,
                numberOfTransactions: transactions.length,
                totalAmount: transactionData.amount,
                totalFee: transactionData.fee,
                reward: options.reward,
                payloadLength: 32 * transactions.length,
                payloadHash: crypto_1.Crypto.HashAlgorithms.sha256(payloadBuffers).toString("hex"),
                transactions,
            }, this.keys);
            if (this.bip38) {
                this.encryptKeysWithOtp();
            }
            return block;
        }
        return undefined;
    }
    encryptDataWithOtp(content, password) {
        const cipher = node_forge_1.default.cipher.createCipher("AES-CBC", node_forge_1.default.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize));
        cipher.start({ iv: this.otp });
        cipher.update(node_forge_1.default.util.createBuffer(content));
        cipher.finish();
        return node_forge_1.default.util.encode64(cipher.output.getBytes());
    }
    decryptDataWithOtp(cipherText, password) {
        const decipher = node_forge_1.default.cipher.createDecipher("AES-CBC", node_forge_1.default.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize));
        decipher.start({ iv: this.otp });
        decipher.update(node_forge_1.default.util.createBuffer(node_forge_1.default.util.decode64(cipherText)));
        decipher.finish();
        return decipher.output.toString();
    }
}
exports.Delegate = Delegate;
//# sourceMappingURL=delegate.js.map