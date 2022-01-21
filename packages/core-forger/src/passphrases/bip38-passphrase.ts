import { Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Crypto, Identities, Interfaces, Managers } from "@arkecosystem/crypto";
import forge from "node-forge";
import wif from "wif";

import { UseKeysFunction } from "../interfaces";
import { AbstractPassphrase } from "./abstract-passphrase";

export class Bip38Passphrase extends AbstractPassphrase {
    public otp: string | undefined;
    private readonly otpSecret: string;
    private encryptedKeys: string | undefined;
    private keys: Interfaces.IKeyPair | undefined;

    private readonly keySize: number;
    private readonly iterations: number;

    public constructor(bip38: string, password: string) {
        const keys = Bip38Passphrase.decryptPassphrase(bip38, password);

        super(keys.publicKey);

        this.keySize = 32;
        this.iterations = 5000;
        this.keys = keys;

        this.otpSecret = forge.random.getBytesSync(128);

        this.encryptKeysWithOtp();
    }

    private static decryptPassphrase(passphrase: string, password: string): Interfaces.IKeyPair {
        const decryptedWif: Interfaces.IDecryptResult = Crypto.bip38.decrypt(passphrase, password);
        const wifKey: string = wif.encode(
            Managers.configManager.get("network.wif"),
            decryptedWif.privateKey,
            decryptedWif.compressed,
        );

        return Identities.Keys.fromWIF(wifKey);
    }

    public useKeys(fn: UseKeysFunction) {
        // TODO: Handle errors
        this.decryptKeysWithOtp();

        AppUtils.assert.defined<Interfaces.IKeyPair>(this.keys);

        fn(this.keys);

        this.encryptKeysWithOtp();
    }

    private encryptKeysWithOtp(): void {
        AppUtils.assert.defined<Interfaces.IKeyPair>(this.keys);

        const wifKey: string = Identities.WIF.fromKeys(this.keys);

        this.keys = undefined;
        this.otp = forge.random.getBytesSync(16);
        this.encryptedKeys = this.encryptDataWithOtp(wifKey, this.otp);
    }

    private decryptKeysWithOtp(): void {
        AppUtils.assert.defined<string>(this.encryptedKeys);
        AppUtils.assert.defined<string>(this.otp);

        const wifKey: string = this.decryptDataWithOtp(this.encryptedKeys, this.otp);

        this.keys = Identities.Keys.fromWIF(wifKey);
        this.otp = undefined;
        this.encryptedKeys = undefined;
    }

    /**
     * @private
     * @param {string} content
     * @param {string} password
     * @returns {string}
     * @memberof BIP38
     */
    private encryptDataWithOtp(content: string, password: string): string {
        AppUtils.assert.defined<string>(this.otpSecret);

        const cipher: forge.cipher.BlockCipher = forge.cipher.createCipher(
            "AES-CBC",
            forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
        );
        cipher.start({ iv: this.otp });
        cipher.update(forge.util.createBuffer(content));
        cipher.finish();

        return forge.util.encode64(cipher.output.getBytes());
    }

    /**
     * @private
     * @param {string} cipherText
     * @param {string} password
     * @returns {string}
     * @memberof BIP38
     */
    private decryptDataWithOtp(cipherText: string, password: string): string {
        AppUtils.assert.defined<string>(this.otpSecret);

        const decipher: forge.cipher.BlockCipher = forge.cipher.createDecipher(
            "AES-CBC",
            forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
        );
        decipher.start({ iv: this.otp });
        decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
        decipher.finish();

        return decipher.output.toString();
    }
}
