import { State } from "@arkecosystem/core-interfaces";
import { Errors, Handlers } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import assert from "assert";
import dottie from "dottie";

export class Wallet implements State.IWallet {
    public address: string;
    public publicKey: string | undefined;
    public balance: Utils.BigNumber;
    public nonce: Utils.BigNumber;

    private readonly attributes: Record<string, any>;

    constructor(address: string) {
        this.address = address;
        this.balance = Utils.BigNumber.ZERO;
        this.nonce = Utils.BigNumber.ZERO;

        this.attributes = {};
    }

    public hasAttribute(key: string): boolean {
        this.assertKnownAttribute(key);
        return dottie.exists(this.attributes, key);
    }

    public getAttribute<T>(key: string, defaultValue?: T): T {
        this.assertKnownAttribute(key);
        return dottie.get(this.attributes, key, defaultValue);
    }

    public setAttribute<T = any>(key: string, value: T): void {
        this.assertKnownAttribute(key);
        dottie.set(this.attributes, key, value);
    }

    public forgetAttribute(key: string): void {
        this.assertKnownAttribute(key);
        this.setAttribute(key, undefined);
    }

    public getAttributes(): Readonly<Record<string, any>> {
        return this.attributes;
    }

    public isDelegate(): boolean {
        return !!this.getAttribute("delegate");
    }

    public hasVoted(): boolean {
        return !!this.getAttribute("vote");
    }

    public hasSecondSignature(): boolean {
        return !!this.getAttribute("secondPublicKey");
    }

    public hasMultiSignature(): boolean {
        return !!this.getAttribute("multiSignature");
    }

    public canBePurged(): boolean {
        const hasAttributes = Object.keys(this.attributes).length > 0;
        const lockedBalance = this.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
        return this.balance.isZero() && lockedBalance.isZero() && !hasAttributes;
    }

    public applyBlock(block: Interfaces.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address
        ) {
            this.balance = this.balance.plus(block.reward).plus(block.totalFee);

            const delegate: State.IWalletDelegateAttributes = this.getAttribute("delegate");

            delegate.producedBlocks++;
            delegate.forgedFees = delegate.forgedFees.plus(block.totalFee);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.reward);
            delegate.lastBlock = block;

            return true;
        }

        return false;
    }

    public revertBlock(block: Interfaces.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address
        ) {
            this.balance = this.balance.minus(block.reward).minus(block.totalFee);

            const delegate: State.IWalletDelegateAttributes = this.getAttribute("delegate");

            delegate.forgedFees = delegate.forgedFees.minus(block.totalFee);
            delegate.forgedRewards = delegate.forgedRewards.minus(block.reward);
            delegate.producedBlocks--;

            // TODO: get it back from database?
            delegate.lastBlock = undefined;

            return true;
        }

        return false;
    }

    public verifySignatures(
        transaction: Interfaces.ITransactionData,
        multiSignature?: Interfaces.IMultiSignatureAsset,
    ): boolean {
        return Transactions.Verifier.verifySignatures(
            transaction,
            multiSignature || this.getAttribute("multiSignature"),
        );
    }

    /**
     * Verify that the transaction's nonce is the wallet nonce plus one, so that the
     * transaction can be applied to the wallet.
     * Throw an exception if it is not.
     */
    public verifyTransactionNonceApply(transaction: Interfaces.ITransaction): void {
        if (transaction.data.version > 1 && !this.nonce.plus(1).isEqualTo(transaction.data.nonce)) {
            throw new Errors.UnexpectedNonceError(transaction.data.nonce, this, false);
        }
    }

    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet.
     * Throw an exception if it is not.
     */
    public verifyTransactionNonceRevert(transaction: Interfaces.ITransaction): void {
        if (transaction.data.version > 1 && !this.nonce.isEqualTo(transaction.data.nonce)) {
            throw new Errors.UnexpectedNonceError(transaction.data.nonce, this, true);
        }
    }

    public auditApply(transaction: Interfaces.ITransactionData): any[] {
        const audit = [];

        const delegate: State.IWalletDelegateAttributes = this.getAttribute("delegate");
        const secondPublicKey: string = this.getAttribute("secondPublicKey");
        const multiSignature: State.IWalletMultiSignatureAttributes = this.getAttribute("multiSignature");

        if (multiSignature) {
            audit.push({
                Mutisignature: this.verifySignatures(transaction, multiSignature),
            });
        } else {
            audit.push({
                "Remaining amount": +this.balance
                    .minus(transaction.amount)
                    .minus(transaction.fee)
                    .toFixed(),
            });
            audit.push({ "Signature validation": Transactions.Verifier.verifyHash(transaction) });
            if (secondPublicKey) {
                audit.push({
                    "Second Signature Verification": Transactions.Verifier.verifySecondSignature(
                        transaction,
                        secondPublicKey,
                    ),
                });
            }
        }

        if (transaction.version > 1 && !this.nonce.plus(1).isEqualTo(transaction.nonce)) {
            audit.push({
                "Invalid Nonce": transaction.nonce,
                "Wallet Nonce": this.nonce,
            });
        }

        const typeGroup: number = transaction.typeGroup || Enums.TransactionTypeGroup.Core;
        if (typeGroup === Enums.TransactionTypeGroup.Core) {
            if (transaction.type === Enums.TransactionType.Transfer) {
                audit.push({ Transfer: true });
            }

            if (transaction.type === Enums.TransactionType.SecondSignature) {
                audit.push({ "Second public key": secondPublicKey });
            }

            if (transaction.type === Enums.TransactionType.DelegateRegistration) {
                const username = transaction.asset.delegate.username;
                audit.push({ "Current username": delegate.username });
                audit.push({ "New username": username });
            }

            if (transaction.type === Enums.TransactionType.DelegateResignation) {
                audit.push({ "Resigned delegate": delegate.username });
            }

            if (transaction.type === Enums.TransactionType.Vote) {
                audit.push({ "Current vote": this.getAttribute("vote") });
                audit.push({ "New vote": transaction.asset.votes[0] });
            }

            if (transaction.type === Enums.TransactionType.MultiSignature) {
                const keysgroup = transaction.asset.multisignature.keysgroup;
                audit.push({ "Multisignature not yet registered": !multiSignature });
                audit.push({
                    "Multisignature enough keys": keysgroup.length >= transaction.asset.multiSignature.min,
                });
                audit.push({
                    "Multisignature all keys signed": keysgroup.length === transaction.signatures.length,
                });
                audit.push({
                    "Multisignature verification": this.verifySignatures(transaction, transaction.asset.multiSignature),
                });
            }

            if (transaction.type === Enums.TransactionType.Ipfs) {
                audit.push({ IPFS: true });
            }

            if (transaction.type === Enums.TransactionType.MultiPayment) {
                const amount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
                audit.push({ "Multipayment remaining amount": amount });
            }

            if (!(transaction.type in Enums.TransactionType)) {
                audit.push({ "Unknown Type": true });
            }
        } else {
            audit.push({ Type: transaction.type, TypeGroup: transaction.typeGroup });
        }

        return audit;
    }

    public toString(): string {
        return `${this.address} (${Utils.formatSatoshi(this.balance)})`;
    }

    private assertKnownAttribute(key: string): void {
        assert(Handlers.Registry.isKnownWalletAttribute(key), `Tried to access unknown attribute: ${key}`);
    }
}
