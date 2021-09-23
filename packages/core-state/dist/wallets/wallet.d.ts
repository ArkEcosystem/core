import { State } from "@arkecosystem/core-interfaces";
import { Interfaces, Utils } from "@arkecosystem/crypto";
export declare class Wallet implements State.IWallet {
    address: string;
    publicKey: string | undefined;
    balance: Utils.BigNumber;
    nonce: Utils.BigNumber;
    private readonly attributes;
    constructor(address: string);
    hasAttribute(key: string): boolean;
    getAttribute<T>(key: string, defaultValue?: T): T;
    setAttribute<T = any>(key: string, value: T): void;
    forgetAttribute(key: string): void;
    getAttributes(): Readonly<Record<string, any>>;
    isDelegate(): boolean;
    hasVoted(): boolean;
    hasSecondSignature(): boolean;
    hasMultiSignature(): boolean;
    canBePurged(): boolean;
    applyBlock(block: Interfaces.IBlockData): boolean;
    revertBlock(block: Interfaces.IBlockData): boolean;
    verifySignatures(transaction: Interfaces.ITransactionData, multiSignature?: Interfaces.IMultiSignatureAsset): boolean;
    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceApply(transaction: Interfaces.ITransaction): void;
    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet.
     * Throw an exception if it is not.
     */
    verifyTransactionNonceRevert(transaction: Interfaces.ITransaction): void;
    auditApply(transaction: Interfaces.ITransactionData): any[];
    toString(): string;
    private assertKnownAttribute;
}
