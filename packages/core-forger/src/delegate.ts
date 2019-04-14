import { Blocks, Crypto, Interfaces, Types, Utils } from "@arkecosystem/crypto";
import forge from "node-forge";
import { authenticator } from "otplib";
import wif from "wif";

export class Delegate {
    public static encryptPassphrase(passphrase: string, network: Types.NetworkType, password: string): string {
        const keys = Crypto.crypto.getKeys(passphrase);
        const decoded = wif.decode(Crypto.crypto.keysToWIF(keys, network), network.wif);

        return Crypto.bip38.encrypt(decoded.privateKey, decoded.compressed, password);
    }

    public static decryptPassphrase(
        passphrase: string,
        network: Types.NetworkType,
        password: string,
    ): Interfaces.IKeyPair {
        const decryptedWif: Interfaces.IDecryptResult = Crypto.bip38.decrypt(passphrase, password);
        const wifKey: string = wif.encode(network.wif, decryptedWif.privateKey, decryptedWif.compressed);

        return Crypto.crypto.getKeysFromWIF(wifKey, network);
    }

    public network: Types.NetworkType;
    public keySize: number;
    public iterations: number;
    public keys: Interfaces.IKeyPair;
    public publicKey: string;
    public address: string;
    public otpSecret: string;
    public bip38: boolean = false;
    public otp: string;
    public encryptedKeys: string;

    constructor(passphrase: string, network: Types.NetworkType, password?: string) {
        this.network = network;
        this.keySize = 32; // AES-256
        this.iterations = 5000;

        if (Crypto.bip38.verify(passphrase)) {
            try {
                this.keys = Delegate.decryptPassphrase(passphrase, network, password);
                this.publicKey = this.keys.publicKey;
                this.address = Crypto.crypto.getAddress(this.keys.publicKey, network.pubKeyHash);
                this.otpSecret = authenticator.generateSecret();
                this.bip38 = true;

                this.encryptKeysWithOtp();
            } catch (error) {
                this.publicKey = null;
                this.keys = null;
                this.address = null;
            }
        } else {
            this.keys = Crypto.crypto.getKeys(passphrase);
            this.publicKey = this.keys.publicKey;
            this.address = Crypto.crypto.getAddress(this.publicKey, network.pubKeyHash);
        }
    }

    public encryptKeysWithOtp(): void {
        this.otp = authenticator.generate(this.otpSecret);

        const wifKey: string = Crypto.crypto.keysToWIF(this.keys, this.network);

        this.encryptedKeys = this.encryptDataWithOtp(wifKey, this.otp);
        this.keys = null;
    }

    public decryptKeysWithOtp(): void {
        const wifKey: string = this.decryptDataWithOtp(this.encryptedKeys, this.otp);

        this.keys = Crypto.crypto.getKeysFromWIF(wifKey, this.network);
        this.otp = null;
        this.encryptedKeys = null;
    }

    // @TODO: reduce nesting
    public forge(transactions: Interfaces.ITransactionData[], options: Record<string, any>): Interfaces.IBlock | null {
        if (!options.version && (this.encryptedKeys || !this.bip38)) {
            const transactionData: { amount: Utils.Bignum; fee: Utils.Bignum } = {
                amount: Utils.Bignum.ZERO,
                fee: Utils.Bignum.ZERO,
            };

            const payloadBuffers: Buffer[] = [];
            const sortedTransactions = Utils.sortTransactions(transactions);
            sortedTransactions.forEach(transaction => {
                transactionData.amount = transactionData.amount.plus(transaction.amount);
                transactionData.fee = transactionData.fee.plus(transaction.fee);
                payloadBuffers.push(Buffer.from(transaction.id, "hex"));
            });

            if (this.bip38) {
                this.decryptKeysWithOtp();
            }

            const block: Interfaces.IBlock = Blocks.Block.createFromData(
                {
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
                    payloadHash: Crypto.HashAlgorithms.sha256(payloadBuffers).toString("hex"),
                    transactions: sortedTransactions,
                },
                this.keys,
            );

            if (this.bip38) {
                this.encryptKeysWithOtp();
            }

            return block;
        }

        return null;
    }

    private encryptDataWithOtp(content: string, password: string): string {
        const cipher: forge.cipher.BlockCipher = forge.cipher.createCipher(
            "AES-CBC",
            forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
        );
        cipher.start({ iv: forge.util.decode64(this.otp) });
        cipher.update(forge.util.createBuffer(content));
        cipher.finish();

        return forge.util.encode64(cipher.output.getBytes());
    }

    private decryptDataWithOtp(cipherText: string, password: string): string {
        const decipher: forge.cipher.BlockCipher = forge.cipher.createDecipher(
            "AES-CBC",
            forge.pkcs5.pbkdf2(password, this.otpSecret, this.iterations, this.keySize),
        );
        decipher.start({ iv: forge.util.decode64(this.otp) });
        decipher.update(forge.util.createBuffer(forge.util.decode64(cipherText)));
        decipher.finish();

        return decipher.output.toString();
    }
}
