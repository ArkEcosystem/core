import { CryptoManager } from "..";
import { DuplicateParticipantInMultiSignatureError, InvalidMultiSignatureAssetError } from "../errors";
import { IMultiSignatureAsset, ISchemaValidationResult, ITransactionData, Validator } from "../interfaces";
import { TransactionTypeFactory } from "./types/factory";
import { Utils } from "./utils";

export class Verifier<T, U extends ITransactionData, E> {
    public constructor(
        private cryptoManager: CryptoManager<T>,
        private utils: Utils<T, U, E>,
        private validator: Validator<U, E>,
        private transactionTypeFactory: TransactionTypeFactory<T, U, E>,
    ) {}

    public verify(data: U): boolean {
        if (this.cryptoManager.LibraryManager.Utils.isException(data.id)) {
            return true;
        }

        if (this.cryptoManager.MilestoneManager.getMilestone().aip11 && (!data.version || data.version === 1)) {
            return false;
        }

        return this.verifyHash(data);
    }

    public verifySecondSignature(transaction: U, publicKey: string): boolean {
        const secondSignature: string | undefined = transaction.secondSignature || transaction.signSignature;

        if (!secondSignature) {
            return false;
        }

        const hash: Buffer = this.utils.toHash(transaction, { excludeSecondSignature: true });
        return this.internalVerifySignature(hash, secondSignature, publicKey);
    }

    public verifySignatures(transaction: U, multiSignature: IMultiSignatureAsset): boolean {
        if (!multiSignature) {
            throw new InvalidMultiSignatureAssetError();
        }

        const { publicKeys, min }: IMultiSignatureAsset = multiSignature;
        const { signatures }: U = transaction;

        const hash: Buffer = this.utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        const publicKeyIndexes: { [index: number]: boolean } = {};
        let verified: boolean = false;
        let verifiedSignatures: number = 0;

        if (signatures) {
            for (let i = 0; i < signatures.length; i++) {
                const signature: string = signatures[i];
                const publicKeyIndex: number = parseInt(signature.slice(0, 2), 16);

                if (!publicKeyIndexes[publicKeyIndex]) {
                    publicKeyIndexes[publicKeyIndex] = true;
                } else {
                    throw new DuplicateParticipantInMultiSignatureError();
                }

                const partialSignature: string = signature.slice(2, 130);
                const publicKey: string = publicKeys[publicKeyIndex];

                if (this.cryptoManager.LibraryManager.Crypto.Hash.verifySchnorr(hash, partialSignature, publicKey)) {
                    verifiedSignatures++;
                }

                if (verifiedSignatures === min) {
                    verified = true;
                    break;
                } else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                    break;
                }
            }
        }

        return verified;
    }

    public verifyHash(data: U): boolean {
        const { signature, senderPublicKey } = data;

        if (!signature || !senderPublicKey) {
            return false;
        }

        const hash: Buffer = this.utils.toHash(data, {
            excludeSignature: true,
            excludeSecondSignature: true,
        });

        return this.internalVerifySignature(hash, signature, senderPublicKey);
    }

    public verifySchema(data: U, strict = true): ISchemaValidationResult<U, E> {
        const transactionType = this.transactionTypeFactory.get(data.type, data.typeGroup, data.version);

        if (!transactionType) {
            throw new Error();
        }

        const { $id } = transactionType.getSchema();

        return this.validator.validate(strict ? `${$id}Strict` : `${$id}`, data);
    }

    private internalVerifySignature(hash: Buffer, signature: string, publicKey: string): boolean {
        const isSchnorr = Buffer.from(signature, "hex").byteLength === 64;
        if (isSchnorr) {
            return this.cryptoManager.LibraryManager.Crypto.Hash.verifySchnorr(hash, signature, publicKey);
        }

        return this.cryptoManager.LibraryManager.Crypto.Hash.verifyECDSA(hash, signature, publicKey);
    }
}
