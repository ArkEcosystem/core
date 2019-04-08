import {
    Bignum,
    bip38,
    blocks,
    crypto,
    HashAlgorithms,
    interfaces,
    ITransactionData,
    KeyPair,
    sortTransactions,
    types,
} from "@arkecosystem/crypto";
import forge from "node-forge";
import { authenticator } from "otplib";
import wif from "wif";

export class Delegate {
    /**
     * BIP38 encrypt passphrase.
     */
    public static encryptPassphrase(passphrase: string, network: types.INetwork, password: string): string {
        const keys = crypto.getKeys(passphrase);
        // @ts-ignore
        const decoded = wif.decode(crypto.keysToWIF(keys, network));

        return bip38.encrypt(decoded.privateKey, decoded.compressed, password);
    }

    /**
     * BIP38 decrypt passphrase keys.
     */
    public static decryptPassphrase(passphrase: string, network: types.INetwork, password?: string): KeyPair {
        const decryptedWif = bip38.decrypt(passphrase, password);
        const wifKey = wif.encode(network.wif, decryptedWif.privateKey, decryptedWif.compressed);

        return crypto.getKeysFromWIF(wifKey, network);
    }

    public network: types.INetwork;
    public keySize: number;
    public iterations: number;
    public keys: KeyPair;
    public publicKey: string;
    public address: string;
    public otpSecret: string;
    public bip38: boolean = false;
    public otp: string;
    public encryptedKeys: string;

    constructor(passphrase: string, network: types.INetwork, password?: string) {
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
    public encryptKeysWithOtp(): void {
        this.otp = authenticator.generate(this.otpSecret);
        const wifKey = crypto.keysToWIF(this.keys, this.network);
        this.encryptedKeys = this.encryptData(wifKey, this.otp);
        this.keys = null;
    }

    /**
     * Decrypt keys with one time password.
     */
    public decryptKeysWithOtp(): void {
        const wifKey = this.decryptData(this.encryptedKeys, this.otp);
        this.keys = crypto.getKeysFromWIF(wifKey, this.network);
        this.otp = null;
        this.encryptedKeys = null;
    }

    /**
     * Forge block - we consider transactions are signed, verified and unique.
     */
    public forge(transactions: ITransactionData[], options: any): blocks.Block | null {
        if (!options.version && (this.encryptedKeys || !this.bip38)) {
            const transactionData = {
                amount: Bignum.ZERO,
                fee: Bignum.ZERO,
            };

            const payloadBuffers = [];
            const sortedTransactions = sortTransactions(transactions);
            sortedTransactions.forEach(transaction => {
                transactionData.amount = transactionData.amount.plus(transaction.amount);
                transactionData.fee = transactionData.fee.plus(transaction.fee);
                payloadBuffers.push(Buffer.from(transaction.id, "hex"));
            });

            const data: interfaces.IBlockData = {
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
                payloadHash: HashAlgorithms.sha256(payloadBuffers).toString("hex"),
                transactions: sortedTransactions,
            };

            if (this.bip38) {
                this.decryptKeysWithOtp();
            }

            const block = blocks.Block.create(data, this.keys);

            if (this.bip38) {
                this.encryptKeysWithOtp();
            }

            return block;
        }

        return null;
    }

    /**
     * Perform OTP encryption.
     */
    private encryptData(content: string, password: string): string {
        const derivedKey = forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize);
        const cipher = forge.cipher.createCipher("AES-CBC", derivedKey);
        cipher.start({ iv: forge.util.decode64(this.otp) });
        cipher.update(forge.util.createBuffer(content));
        cipher.finish();

        return forge.util.encode64(cipher.output.getBytes());
    }

    /**
     * Perform OTP decryption.
     */
    private decryptData(cipherText: string, password: string): string {
        const derivedKey = forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize);
        const decipher = forge.cipher.createDecipher("AES-CBC", derivedKey);
        decipher.start({ iv: forge.util.decode64(this.otp) });
        decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
        decipher.finish();

        return decipher.output.toString();
    }
}
