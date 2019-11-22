import { Container, Contracts, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Errors } from "@arkecosystem/core-transactions";
import {
    Enums,
    Identities,
    Interfaces,
    Transactions,
    Utils,
} from "@arkecosystem/crypto";
import { cloneDeep } from "@arkecosystem/utils";

// todo: review the implementation
export class Wallet implements Contracts.State.Wallet {
    public address: string;
    public publicKey: string | undefined;
    public balance: Utils.BigNumber;
    public nonce: Utils.BigNumber;

    private readonly attributes: Services.Attributes.AttributeMap;

    public constructor(address: string, app: Contracts.Kernel.Application) {
        this.address = address;
        this.balance = Utils.BigNumber.ZERO;
        this.nonce = Utils.BigNumber.ZERO;

        this.attributes = new Services.Attributes.AttributeMap(
            app.get<Services.Attributes.AttributeSet>(Container.Identifiers.WalletAttributes),
        );
    }

    public getAttributes() {
        return this.attributes.all();
    }

    public getAttribute<T>(key: string, defaultValue?: T): T {
        return this.attributes.get<T>(key, defaultValue);
    }

    public setAttribute<T = any>(key: string, value: T): boolean {
        return this.attributes.set<T>(key, value);
    }

    public forgetAttribute(key: string): boolean {
        return this.attributes.forget(key);
    }

    public hasAttribute(key: string): boolean {
        return this.attributes.has(key);
    }

    public isDelegate(): boolean {
        return this.hasAttribute("delegate");
    }

    public hasVoted(): boolean {
        return this.hasAttribute("vote");
    }

    public hasSecondSignature(): boolean {
        return this.hasAttribute("secondPublicKey");
    }

    public hasMultiSignature(): boolean {
        return this.hasAttribute("multiSignature");
    }

    public canBePurged(): boolean {
        const attributes: object = this.attributes.all();

        const hasAttributes: boolean = !!attributes && Object.keys(attributes).length > 0;

        if (this.hasAttribute("htlc.lockedBalance")) {
            const lockedBalance: AppUtils.BigNumber = this.getAttribute("htlc.lockedBalance");

            if (!lockedBalance.isZero()) {
                return false;
            }
        }

        return this.balance.isZero() && !hasAttributes;
    }

    public applyBlock(block: Interfaces.IBlockData): boolean {
        if (
            block.generatorPublicKey === this.publicKey ||
            Identities.Address.fromPublicKey(block.generatorPublicKey) === this.address
        ) {
            this.balance = this.balance.plus(block.reward).plus(block.totalFee);

            const delegate: Contracts.State.WalletDelegateAttributes = this.getAttribute("delegate");
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

            const delegate: Contracts.State.WalletDelegateAttributes = this.getAttribute("delegate");

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
        const version: number = transaction.data.version || 1;
        const nonce: AppUtils.BigNumber = transaction.data.nonce || AppUtils.BigNumber.ZERO;

        if (version > 1 && !this.nonce.plus(1).isEqualTo(nonce)) {
            throw new Errors.UnexpectedNonceError(nonce, this, false);
        }
    }

    /**
     * Verify that the transaction's nonce is the same as the wallet nonce, so that the
     * transaction can be reverted from the wallet.
     * Throw an exception if it is not.
     */
    public verifyTransactionNonceRevert(transaction: Interfaces.ITransaction): void {
        const version: number = transaction.data.version || 1;
        const nonce: AppUtils.BigNumber = transaction.data.nonce || AppUtils.BigNumber.ZERO;

        if (version > 1 && !this.nonce.isEqualTo(nonce)) {
            throw new Errors.UnexpectedNonceError(nonce, this, true);
        }
    }

    public auditApply(transaction: Interfaces.ITransactionData): any[] {
        const audit: any[] = [];

        const delegate: Contracts.State.WalletDelegateAttributes = this.getAttribute("delegate");
        const secondPublicKey: string = this.getAttribute("secondPublicKey");
        const multiSignature: Contracts.State.WalletMultiSignatureAttributes = this.getAttribute("multiSignature");

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

        AppUtils.assert.defined<number>(transaction.version);
        AppUtils.assert.defined<AppUtils.BigNumber>(transaction.nonce);

        if (transaction.version > 1 && !this.nonce.plus(1).isEqualTo(transaction.nonce)) {
            audit.push({
                "Invalid Nonce": transaction.nonce,
                "Wallet Nonce": this.nonce,
            });
        }

        const typeGroup: number = transaction.typeGroup || Enums.TransactionTypeGroup.Core;
        if (typeGroup === Enums.TransactionTypeGroup.Core) {
            AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.asset);

            const asset: Interfaces.ITransactionAsset = transaction.asset;

            if (transaction.type === Enums.TransactionType.Transfer) {
                audit.push({ Transfer: true });
            }

            if (transaction.type === Enums.TransactionType.SecondSignature) {
                audit.push({ "Second public key": secondPublicKey });
            }

            if (transaction.type === Enums.TransactionType.DelegateRegistration) {
                const username = asset.delegate!.username;
                audit.push({ "Current username": delegate.username });
                audit.push({ "New username": username });
            }

            if (transaction.type === Enums.TransactionType.DelegateResignation) {
                audit.push({ "Resigned delegate": delegate.username });
            }

            if (transaction.type === Enums.TransactionType.Vote) {
                audit.push({ "Current vote": this.getAttribute("vote") });
                audit.push({ "New vote": asset.votes![0] });
            }

            if (transaction.type === Enums.TransactionType.MultiSignature) {
                const keysgroup = asset.multisignature.keysgroup || [];

                audit.push({ "Multisignature not yet registered": !multiSignature });

                audit.push({
                    "Multisignature enough keys": keysgroup.length >= asset.multiSignature!.min,
                });

                AppUtils.assert.defined<string[]>(transaction.signatures);

                audit.push({
                    "Multisignature all keys signed": keysgroup.length === transaction.signatures.length,
                });

                audit.push({
                    "Multisignature verification": this.verifySignatures(transaction, asset.multiSignature),
                });
            }

            if (transaction.type === Enums.TransactionType.Ipfs) {
                audit.push({ IPFS: true });
            }

            if (transaction.type === Enums.TransactionType.MultiPayment) {
                const amount = asset.payments!.reduce((a, p) => a.plus(p.amount), Utils.BigNumber.ZERO);
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

    public clone(): Contracts.State.Wallet {
        return cloneDeep(this);
    }

    public toString(): string {
        return `${this.address} (${Utils.formatSatoshi(this.balance)})`;
    }
}
