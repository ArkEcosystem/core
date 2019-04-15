import secp256k1 from "secp256k1";
import { Address, Keys, PublicKey, WIF } from "../identities";
import { IKeyPair, ISerializeOptions, ITransactionData } from "../interfaces";
import { INetwork } from "../interfaces/networks";
import { configManager, feeManager } from "../managers";
import { Serializer } from "../transactions/serializer";
import { BigNumber } from "../utils";
import { HashAlgorithms } from "./hash-algorithms";

class Crypto {
    public getFee(transaction: ITransactionData): BigNumber {
        return feeManager.get(transaction.type);
    }

    public getId(transaction: ITransactionData): string {
        const id: string = this.getHash(transaction).toString("hex");

        // Apply fix for broken type 1 and 4 transactions, which were
        // erroneously calculated with a recipient id.
        const { transactionIdFixTable } = configManager.get("exceptions");

        if (transactionIdFixTable && transactionIdFixTable[id]) {
            return transactionIdFixTable[id];
        }

        return id;
    }

    public getHash(transaction: ITransactionData, options?: ISerializeOptions): Buffer {
        return HashAlgorithms.sha256(Serializer.getBytes(transaction, options));
    }

    public sign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = this.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true });
        const signature: string = this.signECDSA(hash, keys);

        if (!transaction.signature) {
            transaction.signature = signature;
        }

        return signature;
    }

    public secondSign(transaction: ITransactionData, keys: IKeyPair): string {
        const hash: Buffer = this.getHash(transaction, { excludeSecondSignature: true });
        const signature: string = this.signECDSA(hash, keys);

        if (!transaction.secondSignature) {
            transaction.secondSignature = signature;
        }

        return signature;
    }

    public signECDSA(hash: Buffer, keys: IKeyPair): string {
        return secp256k1
            .signatureExport(secp256k1.sign(hash, Buffer.from(keys.privateKey, "hex")).signature)
            .toString("hex");
    }

    public verify(transaction: ITransactionData): boolean {
        if (transaction.version && transaction.version !== 1) {
            // TODO: enable AIP11 when ready here
            return false;
        }

        if (!transaction.signature) {
            return false;
        }

        return this.verifyECDSA(
            this.getHash(transaction, { excludeSignature: true, excludeSecondSignature: true }),
            transaction.signature,
            transaction.senderPublicKey,
        );
    }

    public verifySecondSignature(transaction: ITransactionData, publicKey: string): boolean {
        // tslint:disable-next-line:prefer-const
        let { secondSignature, signSignature } = transaction;
        secondSignature = secondSignature || signSignature;

        if (!secondSignature) {
            return false;
        }

        return this.verifyECDSA(
            this.getHash(transaction, { excludeSecondSignature: true }),
            secondSignature,
            publicKey,
        );
    }

    public verifyECDSA(hash: Buffer, signature: Buffer | string, publicKey: Buffer | string): boolean {
        return secp256k1.verify(
            hash,
            secp256k1.signatureImport(signature instanceof Buffer ? signature : Buffer.from(signature, "hex")),
            publicKey instanceof Buffer ? publicKey : Buffer.from(publicKey, "hex"),
        );
    }

    public getKeys(secret: string, compressed: boolean = true): IKeyPair {
        return Keys.fromPassphrase(secret, compressed);
    }

    public getKeysByPrivateKey(privateKey: Buffer | string, compressed: boolean = true): IKeyPair {
        return Keys.fromPrivateKey(
            privateKey instanceof Buffer ? privateKey : Buffer.from(privateKey, "hex"),
            compressed,
        );
    }

    public getKeysFromWIF(wifKey: string, network?: INetwork): IKeyPair {
        return Keys.fromWIF(wifKey, network);
    }

    public keysToWIF(keys: IKeyPair, network?: INetwork): string {
        return WIF.fromKeys(keys, network);
    }

    public getAddress(publicKey: string, networkVersion?: number): string {
        return Address.fromPublicKey(publicKey, networkVersion);
    }

    public validateAddress(address: string, networkVersion?: number): boolean {
        return Address.validate(address, networkVersion);
    }

    public validatePublicKey(address: string, networkVersion?: number): boolean {
        return PublicKey.validate(address, networkVersion);
    }
}

export const crypto = new Crypto();
