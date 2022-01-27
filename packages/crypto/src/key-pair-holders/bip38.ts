import assert from "assert";
import forge from "node-forge";
import wif from "wif";

import { decrypt } from "../crypto/bip38";
import { Keys } from "../identities/keys";
import { WIF } from "../identities/wif";
import { IDecryptResult } from "../interfaces/crypto";
import { IKeyPair, UseKeysFunction } from "../interfaces/identities";
import { configManager } from "../managers";
import { AbstractKeyPairHolder } from "./abstract";

export class Bip38 extends AbstractKeyPairHolder {
    public otp: string | undefined;
    private readonly otpSecret: string;
    private encryptedKeys: string | undefined;

    private readonly keySize: number;
    private readonly iterations: number;

    public constructor(bip38: string, password: string) {
        const keys = Bip38.decryptPassphrase(bip38, password);

        super(keys.publicKey);

        this.keySize = 32;
        this.iterations = 5000;
        this.otpSecret = forge.random.getBytesSync(128);

        this.encryptKeysWithOtp(keys);
    }

    private static decryptPassphrase(passphrase: string, password: string): IKeyPair {
        const decryptedWif: IDecryptResult = decrypt(passphrase, password);
        const wifKey: string = wif.encode(
            configManager.get("network.wif"),
            decryptedWif.privateKey,
            decryptedWif.compressed,
        );

        return Keys.fromWIF(wifKey);
    }

    public useKeys<T>(fn: UseKeysFunction<T>): T {
        const keys = this.decryptKeysWithOtp();

        let result: T;

        try {
            result = fn({ ...keys });
        } finally {
            this.encryptKeysWithOtp(keys);
        }

        return result;
    }

    private encryptKeysWithOtp(keys): void {
        assert.ok(keys);

        const wifKey: string = WIF.fromKeys(keys);

        this.otp = forge.random.getBytesSync(16);
        this.encryptedKeys = this.encryptDataWithOtp(wifKey, this.otp);
    }

    private decryptKeysWithOtp(): IKeyPair {
        assert.ok(this.encryptedKeys);
        assert.ok(this.otp);

        const wifKey: string = this.decryptDataWithOtp(this.encryptedKeys, this.otp);

        this.otp = undefined;
        this.encryptedKeys = undefined;

        return Keys.fromWIF(wifKey);
    }

    private encryptDataWithOtp(content: string, password: string): string {
        assert.ok(this.otpSecret);

        const cipher: forge.cipher.BlockCipher = forge.cipher.createCipher(
            "AES-CBC",
            forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
        );
        cipher.start({ iv: this.otp });
        cipher.update(forge.util.createBuffer(content));
        cipher.finish();

        return forge.util.encode64(cipher.output.getBytes());
    }

    private decryptDataWithOtp(cipherText: string, password: string): string {
        assert.ok(this.otpSecret);

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
