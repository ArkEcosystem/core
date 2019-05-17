import { State } from "@arkecosystem/core-interfaces";
import { Errors } from "@arkecosystem/core-transactions";
import { Crypto, Enums, Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
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
        return dottie.exists(this.attributes, key);
    }

    public getAttribute<T>(key: string, defaultValue?: T): T {
        return dottie.get(this.attributes, key, defaultValue);
    }

    public setAttribute<T = any>(key: string, value: T): void {
        dottie.set(this.attributes, key, value);
    }

    public unsetAttribute(key: string): void {
        this.setAttribute(key, undefined);
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
        return this.balance.isZero() && !hasAttributes;
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
        multiSignature = multiSignature || this.getAttribute("multiSignature");
        if (!multiSignature) {
            throw new Errors.InvalidMultiSignatureError();
        }

        const { publicKeys, min }: Interfaces.IMultiSignatureAsset = multiSignature;
        const { signatures }: Interfaces.ITransactionData = transaction;

        const hash: Buffer = Transactions.Utils.toHash(transaction, {
            excludeSignature: true,
            excludeSecondSignature: true,
            excludeMultiSignature: true,
        });

        let verified: boolean = false;
        let verifiedSignatures: number = 0;
        for (let i = 0; i < signatures.length; i++) {
            const signature: string = signatures[i];
            const publicKeyIndex: number = parseInt(signature.slice(0, 2), 16);
            const partialSignature: string = signature.slice(2, 130);
            const publicKey: string = publicKeys[publicKeyIndex];

            if (Crypto.Hash.verifySchnorr(hash, partialSignature, publicKey)) {
                verifiedSignatures++;
            }

            if (verifiedSignatures === min) {
                verified = true;
                break;
            } else if (signatures.length - (i + 1 - verifiedSignatures) < min) {
                break;
            }
        }

        return verified;
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

        if (transaction.type === Enums.TransactionTypes.Transfer) {
            audit.push({ Transfer: true });
        }

        if (transaction.type === Enums.TransactionTypes.SecondSignature) {
            audit.push({ "Second public key": secondPublicKey });
        }

        if (transaction.type === Enums.TransactionTypes.DelegateRegistration) {
            const username = transaction.asset.delegate.username;
            audit.push({ "Current username": delegate.username });
            audit.push({ "New username": username });
        }

        if (transaction.type === Enums.TransactionTypes.DelegateResignation) {
            audit.push({ "Resigned delegate": delegate.username });
        }

        if (transaction.type === Enums.TransactionTypes.Vote) {
            audit.push({ "Current vote": this.getAttribute("vote") });
            audit.push({ "New vote": transaction.asset.votes[0] });
        }

        if (transaction.type === Enums.TransactionTypes.MultiSignature) {
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

        if (transaction.type === Enums.TransactionTypes.Ipfs) {
            audit.push({ IPFS: true });
        }

        if (transaction.type === Enums.TransactionTypes.TimelockTransfer) {
            audit.push({ Timelock: true });
        }

        if (transaction.type === Enums.TransactionTypes.MultiPayment) {
            const amount = transaction.asset.payments.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
            audit.push({ "Multipayment remaining amount": amount });
        }

        if (!Object.values(Enums.TransactionTypes).includes(transaction.type)) {
            audit.push({ "Unknown Type": true });
        }

        return audit;
    }

    public toString(): string {
        return `${this.address} (${Utils.formatSatoshi(this.balance)})`;
    }
}
