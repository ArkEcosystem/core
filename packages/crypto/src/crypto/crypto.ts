import secp256k1 from "secp256k1";
import { Address, Keys, PublicKey, WIF } from "../identities";
import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
import { configManager, feeManager } from "../managers";
import { Serializer } from "../transactions/serializer";
import { HashAlgorithms } from "./hash-algorithms";

class Crypto {
    /**
     * Get transaction fee.
     */
    public getFee(transaction: ITransactionData): number {
        return feeManager.get(transaction.type);
    }

    /**
     * Get transaction id.
     */
    public getId(transaction: ITransactionData): string {
        const id = this.getHash(transaction).toString("hex");

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");
        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }

    /**
     * Get transaction hash.
     */
    public getHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        const bytes = Serializer.getBytes(transaction, options);
        return HashAlgorithms.sha256(bytes);
    }

    /**
     * Sign transaction.
     */
    public sign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash = this.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true });
        const signature = this.signHash(hash, keys);

        if (!transaction.signature) {
            transaction.signature = signature;
        }

        return signature;
    }

    /**
     * Sign transaction with second signature.
     */
    public secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash = this.getHash(transaction, { excludeSecondSignature: true });
        const signature = this.signHash(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    /**
     * Sign a hash
     */
    public signHash(hash: Buffer, keys: IKeyPair): string {
        const { signature } = secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex"));
        return secp256k1.signatureExport(signature).toString("hex");
    }

    /**
     * Verify transaction on the network.
     */
    public verify(transaction: ITransactionData): boolean {
        if (transaction.version && transaction.version !== 1) {
            // TODO: enable AIP11 when ready here
            return false;
        }

        if (!transaction.signature) {
            return false;
        }

        const hash = this.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true });
        return this.verifyHash(hash, transaction.signature, transaction.senderPublicKey);
    }

    /**
     * Verify second signature for transaction.
     */
    public verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        // tslint:disable-next-line:prefer-const
        let { secondSignature, signSignature } = transaction;
        secondSignature = secondSignature || signSignature;
        if (!secondSignature) {
            return false;
        }

        const hash = this.getHash(transaction, { excludeSecondSignature: true });
        return this.verifyHash(hash, secondSignature, publicKey);
    }

    /**
     * Verify the hash.
     */
    public verifyHash(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        signature = signature instanceof Buffer ? signature : Buffer.from(signature, "hex");
        publicKey = publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex");
        return secp256k1.verify(hash, secp256k1.signatureImport(signature), publicKey);
    }

    /**
     * Get keys from secret.
     */
    public getKeys(secret: string, compressed: boolean = true): IKeyPair {
        return Keys.fromPassphrase(secret, compressed);
    }

    /**
     * Get keys from a private key.
     */
    public getKeysByPrivateKey(privateKey: Buffer | string, compressed: boolean = true): IKeyPair {
        privateKey = privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex");
        return Keys.fromPrivateKey(privateKey, compressed);
    }

    /**
     * Get keys from WIF key.
     */
    public getKeysFromWIF(wifKey: string, network?: { wif: number }): IKeyPair {
        return Keys.fromWIF(wifKey, network);
    }

    /**
     * Get WIF key from keys
     */
    public keysToWIF(keys: IKeyPair, network?: { wif: number }): string {
        return WIF.fromKeys(keys, network);
    }

    /**
     * Get address from public key.
     */
    public getAddress(publicKey: string, networkVersion?: number): string {
        return Address.fromPublicKey(publicKey, networkVersion);
    }

    /**
     * Validate address.
     */
    public validateAddress(address: string, networkVersion?: number): boolean {
        return Address.validate(address, networkVersion);
    }

    /**
     * Validate public key.
     */
    public validatePublicKey(address: string, networkVersion?: number): boolean {
        return PublicKey.validate(address, networkVersion);
    }
}

export const crypto = new Crypto();
