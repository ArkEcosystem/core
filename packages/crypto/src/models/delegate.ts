import bip38 from "bip38";
import { createHash } from "crypto";
import forge from "node-forge";
import { authenticator } from "otplib";
import wif from "wif";
import { Bignum } from "../utils";

import { crypto } from "../crypto/crypto";
import { sortTransactions } from "../utils";
import { Block } from "./block";

/**
 * TODO copy some parts to ArkDocs
 * @classdesc The delegate model
 *
 * The Delegate model does not store anything on db, but the object contains:
 *   - network
 *   - keySize
 *   - iterations (used for generating the cypher)
 *   - publicKey
 *   - address
 *   - keys
 *   - otpSecret
 *   - bip38
 */
export class Delegate {
    /**
     * BIP38 encrypt passphrase.
     * @param  {String} passphrase
     * @param  {Object} network
     * @param  {String} password
     * @return {String}
     * @static
     */
    public static encryptPassphrase(passphrase, network, password) {
        const keys = crypto.getKeys(passphrase);
        // @ts-ignore
        const decoded = wif.decode(crypto.keysToWIF(keys, network));

        return bip38.encrypt(decoded.privateKey, decoded.compressed, password);
    }

    /**
     * BIP38 decrypt passphrase keys.
     * @param  {String} passphrase
     * @param  {Number} network
     * @param  {String} password
     * @return {Object}
     * @static
     */
    public static decryptPassphrase(passphrase, network, password) {
        const decryptedWif = bip38.decrypt(passphrase, password);
        const wifKey = wif.encode(network.wif, decryptedWif.privateKey, decryptedWif.compressed);

        return crypto.getKeysFromWIF(wifKey, network);
    }
    public network: any;
    public keySize: number;
    public iterations: number;
    public keys: { publicKey: any; privateKey: any; compressed: any };
    public publicKey: any;
    public address: any;
    public otpSecret: string;
    public bip38: boolean = false;
    public otp: string;
    public encryptedKeys: any;

    /**
     * @constructor
     * @param  {String} passphrase
     * @param  {Object} network
     * @param  {String} password
     */
    constructor(passphrase, network, password?: any) {
        this.network = network;
        this.keySize = 32; // AES-256
        this.iterations = 5000;

        if (bip38.verify(passphrase)) {
            try {
                this.keys = Delegate.decryptPassphrase(passphrase, network, password);
                this.publicKey = this.keys.publicKey;
                this.address = crypto.getAddress(this.keys.publicKey, network.pubKeyHash);
                this.otpSecret = authenticator.generateSecret();
                this.bip38 = true;
                this.encryptKeysWithOtp();
            } catch (error) {
                this.publicKey = null;
                this.keys = null;
                this.address = null;
            }
        } else {
            this.keys = crypto.getKeys(passphrase);
            this.publicKey = this.keys.publicKey;
            this.address = crypto.getAddress(this.publicKey, network.pubKeyHash);
        }
    }

    /**
     * Encrypt keys with one time password - used to store encrypted in memory.
     */
    public encryptKeysWithOtp() {
        this.otp = authenticator.generate(this.otpSecret);
        const wifKey = crypto.keysToWIF(this.keys, this.network);
        this.encryptedKeys = this.__encryptData(wifKey, this.otp);
        this.keys = null;
    }

    /**
     * Decrypt keys with one time password.
     */
    public decryptKeysWithOtp() {
        const wifKey = this.__decryptData(this.encryptedKeys, this.otp);
        this.keys = crypto.getKeysFromWIF(wifKey, this.network);
        this.otp = null;
        this.encryptedKeys = null;
    }

    /**
     * Forge block - we consider transactions are signed, verified and unique.
     * @param  {Transaction[]} transactions
     * @param  {Object} options
     * @return {(Block|undefined)}
     */
    public forge(transactions, options) {
        if (!options.version && (this.encryptedKeys || !this.bip38)) {
            const transactionData = {
                amount: Bignum.ZERO,
                fee: Bignum.ZERO,
                sha256: createHash("sha256"),
            };

            const sortedTransactions = sortTransactions(transactions);
            sortedTransactions.forEach(transaction => {
                transactionData.amount = transactionData.amount.plus(transaction.amount);
                transactionData.fee = transactionData.fee.plus(transaction.fee);
                transactionData.sha256.update(Buffer.from(transaction.id, "hex"));
            });

            const data = {
                version: 0,
                generatorPublicKey: this.publicKey,
                timestamp: options.timestamp,
                previousBlock: options.previousBlock.id,
                previousBlockHex: options.previousBlock.idHex,
                height: options.previousBlock.height + 1,
                numberOfTransactions: sortedTransactions.length,
                totalAmount: transactionData.amount,
                totalFee: transactionData.fee,
                reward: options.reward,
                payloadLength: 32 * sortedTransactions.length,
                payloadHash: transactionData.sha256.digest().toString("hex"),
                transactions: sortedTransactions,
            };

            if (this.bip38) {
                this.decryptKeysWithOtp();
            }

            const block = Block.create(data, this.keys);

            if (this.bip38) {
                this.encryptKeysWithOtp();
            }

            return block;
        }

        return false;
    }

    /**
     * Perform OTP encryption.
     * @param  {String} content
     * @param  {String} password
     * @return {String}
     */
    private __encryptData(content, password) {
        const derivedKey = forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize);
        const cipher = forge.cipher.createCipher("AES-CBC", derivedKey);
        cipher.start({ iv: forge.util.decode64(this.otp) });
        cipher.update(forge.util.createBuffer(content));
        cipher.finish();

        return forge.util.encode64(cipher.output.getBytes());
    }

    /**
     * Perform OTP decryption.
     * @param  {String} cipherText
     * @param  {String} password
     * @return {String}
     */
    private __decryptData(cipherText, password) {
        const derivedKey = forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize);
        const decipher = forge.cipher.createDecipher("AES-CBC", derivedKey);
        decipher.start({ iv: forge.util.decode64(this.otp) });
        decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
        decipher.finish();

        return decipher.output.toString();
    }
}
